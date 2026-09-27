import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import {
  appUserReconnectRequired, authorizeAppUserOAuth, callAsAppUser, disconnectAppUser, exchangeAppUserOAuthCode,
} from "../_shared/appUserConnector.ts";
import {
  adminClient, deleteConnectionForUser, getConnectionKeyForUser, saveConnectionKeyForUser,
} from "../_shared/appUserConnections.ts";
import { GOOGLE_DRIVE_SCOPES } from "../_shared/appUserScopes.ts";

const GATEWAY = "https://connector-gateway.lovable.dev";
const CONNECTOR = "google_drive";
const MAX_BYTES = 50 * 1024 * 1024;
const MIME = {
  pdf: "application/pdf",
  gdoc: "application/vnd.google-apps.document",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("start"), origin: z.string().url() }),
  z.object({ action: z.literal("complete"), code: z.string().min(1).max(4096) }),
  z.object({
    action: z.literal("list"),
    search: z.string().max(200).optional(),
    type: z.enum(["all", "pdf", "gdoc", "docx"]).optional(),
    pageToken: z.string().max(2048).optional(),
  }),
  z.object({ action: z.literal("import"), fileId: z.string().regex(/^[\w-]{5,200}$/) }),
  z.object({ action: z.literal("disconnect") }),
  z.object({ action: z.literal("folders"), parentId: z.string().regex(/^[\w-]{1,200}$/).optional() }),
  z.object({ action: z.literal("setFolder"), folderId: z.string().regex(/^[\w-]{1,200}$/), folderName: z.string().min(1).max(300) }),
  z.object({ action: z.literal("clearFolder") }),
  z.object({ action: z.literal("syncNow") }),
  z.object({ action: z.literal("syncAll") }),
]);

type DriveFn = (path: string) => Promise<Response>;
const MAX_PER_SYNC = 25;

class DriveError extends Error { constructor(msg: string, public status: number, public reconnect = false) { super(msg); } }

async function importDriveFile(drive: DriveFn, userId: string, fileId: string) {
  const admin = adminClient();
  const metaRes = await drive(`/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink`);
  if (await appUserReconnectRequired(metaRes)) throw new DriveError("Accès Drive à renouveler", 401, true);
  if (!metaRes.ok) throw new DriveError("Fichier introuvable", 404);
  const meta = await metaRes.json();
  if (!Object.values(MIME).includes(meta.mimeType)) throw new DriveError("Type de fichier non pris en charge", 415);
  if (meta.size && Number(meta.size) > MAX_BYTES) throw new DriveError("Fichier trop lourd (plus de 50 Mo)", 413);

  let bytes: Uint8Array; let ext: string; let contentType: string; let extractedText: string | null = null;
  if (meta.mimeType === MIME.gdoc) {
    const [pdfRes, txtRes] = await Promise.all([
      drive(`/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(MIME.pdf)}`),
      drive(`/drive/v3/files/${fileId}/export?mimeType=text%2Fplain`),
    ]);
    if (!pdfRes.ok) throw new DriveError("Export du document impossible", 502);
    bytes = new Uint8Array(await pdfRes.arrayBuffer()); ext = "pdf"; contentType = MIME.pdf;
    if (txtRes.ok) extractedText = (await txtRes.text()).slice(0, 200000);
  } else {
    const res = await drive(`/drive/v3/files/${fileId}?alt=media`);
    if (!res.ok) throw new DriveError("Téléchargement impossible", 502);
    bytes = new Uint8Array(await res.arrayBuffer());
    ext = meta.mimeType === MIME.pdf ? "pdf" : "docx"; contentType = meta.mimeType;
  }
  if (bytes.byteLength > MAX_BYTES) throw new DriveError("Fichier trop lourd (plus de 50 Mo)", 413);

  const path = `${userId}/drive-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const up = await admin.storage.from("notes").upload(path, bytes, { contentType });
  if (up.error) throw up.error;
  const { data: signed } = await admin.storage.from("notes").createSignedUrl(path, 60 * 60 * 24 * 365);
  const name = meta.name.endsWith(`.${ext}`) ? meta.name : `${meta.name}.${ext}`;
  const { data: row, error } = await admin.from("vault_files").insert({
    user_id: userId, file_url: signed?.signedUrl ?? path, original_filename: name,
    file_type: ext === "pdf" ? "pdf" : "document", extracted_text: extractedText,
    filing_status: "confirmed", tags: ["drive", ext],
  }).select("id").single();
  if (error) throw error;
  await admin.from("drive_imported_files").upsert(
    { user_id: userId, drive_file_id: fileId, vault_file_id: row.id, imported_at: new Date().toISOString() },
    { onConflict: "user_id,drive_file_id" },
  );
  console.log(JSON.stringify({ event: "drive.import", user: userId, file: fileId, source: meta.webViewLink, at: new Date().toISOString() }));
  return { id: row.id as string, name };
}

async function syncFolder(drive: DriveFn, userId: string) {
  const admin = adminClient();
  const { data: folder } = await admin.from("drive_sync_folders").select("folder_id").eq("user_id", userId).maybeSingle();
  if (!folder) return { imported: 0, skipped: 0, noFolder: true };
  const types = Object.values(MIME).map((m) => `mimeType = '${m}'`).join(" or ");
  const q = `'${folder.folder_id}' in parents and trashed = false and (${types})`;
  const files: { id: string }[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ q, pageSize: "100", orderBy: "modifiedTime desc", fields: "nextPageToken,files(id)" });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await drive(`/drive/v3/files?${params}`);
    if (await appUserReconnectRequired(res)) throw new DriveError("Accès Drive à renouveler", 401, true);
    if (!res.ok) throw new DriveError(`Drive a répondu ${res.status}`, 502);
    const d = await res.json();
    files.push(...(d.files ?? []));
    pageToken = d.nextPageToken;
  } while (pageToken && files.length < 500);

  const { data: done } = await admin.from("drive_imported_files").select("drive_file_id").eq("user_id", userId);
  const seen = new Set((done ?? []).map((r) => r.drive_file_id));
  const todo = files.filter((f) => !seen.has(f.id)).slice(0, MAX_PER_SYNC);
  let imported = 0; let lastError: string | null = null;
  for (const f of todo) {
    try { await importDriveFile(drive, userId, f.id); imported++; }
    catch (e) { if (e instanceof DriveError && e.reconnect) throw e; lastError = e instanceof Error ? e.message : String(e); }
  }
  await admin.from("drive_sync_folders").update({
    last_synced_at: new Date().toISOString(), last_imported_count: imported, last_error: lastError,
  }).eq("user_id", userId);
  return { imported, skipped: files.length - todo.length, remaining: Math.max(0, files.filter((f) => !seen.has(f.id)).length - todo.length) };
}

const makeDrive = (key: string): DriveFn => (path) =>
  callAsAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: CONNECTOR, path, requiredScopes: GOOGLE_DRIVE_SCOPES });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Connexion requise" }, 401);
    const raw = await req.json().catch(() => ({}));
    if (raw?.action === "syncAll") {
      // Only service-role callers (daily job) can read app_user_connections
      const token = auth.replace("Bearer ", "");
      let ok = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!ok) {
        const probe = createClient(Deno.env.get("SUPABASE_URL")!, token, { auth: { persistSession: false } });
        const { error: pErr } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
        ok = !pErr;
      }
      if (!ok) return json({ error: "Non autorisé" }, 401);
      const admin = adminClient();
      const { data: rows } = await admin.from("drive_sync_folders").select("user_id");
      const results: unknown[] = [];
      for (const r of rows ?? []) {
        try {
          const key = await getConnectionKeyForUser(r.user_id, CONNECTOR);
          if (!key) { await admin.from("drive_sync_folders").update({ last_error: "Drive déconnecté" }).eq("user_id", r.user_id); continue; }
          results.push({ user: r.user_id, ...(await syncFolder(makeDrive(key), r.user_id)) });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await admin.from("drive_sync_folders").update({ last_error: msg, last_synced_at: new Date().toISOString() }).eq("user_id", r.user_id);
          results.push({ user: r.user_id, error: msg });
        }
      }
      console.log(JSON.stringify({ event: "drive.syncAll", count: results.length }));
      return json({ results });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Connexion requise" }, 401);

    const parsed = Body.safeParse(raw);
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;

    if (body.action === "start") {
      const clientAPIKey = Deno.env.get("GOOGLE_DRIVE_APP_USER_CONNECTOR_CLIENT_API_KEY");
      if (!clientAPIKey) return json({ error: "Google Drive n'est pas configuré" }, 500);
      const existing = await getConnectionKeyForUser(user.id, CONNECTOR);
      const { authorizationUrl } = await authorizeAppUserOAuth({
        gatewayBaseUrl: GATEWAY, connectorId: CONNECTOR, appUserId: user.id, clientAPIKey,
        returnUrl: new URL("/oauth/google-drive/return", body.origin).toString(),
        connectionAPIKey: existing ?? undefined,
        credentialsConfiguration: { scopes: GOOGLE_DRIVE_SCOPES },
      });
      return json({ authorizationUrl });
    }

    if (body.action === "complete") {
      const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY, body.code);
      if (connectorId !== CONNECTOR) return json({ error: "Mauvais service" }, 400);
      await saveConnectionKeyForUser(user.id, CONNECTOR, connectionAPIKey);
      return json({ ok: true });
    }

    const key = await getConnectionKeyForUser(user.id, CONNECTOR);
    if (!key) return json({ connected: false });

    const drive = makeDrive(key);
    const admin = adminClient();

    if (body.action === "disconnect") {
      await disconnectAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: CONNECTOR }).catch((e) => console.error(e));
      await deleteConnectionForUser(user.id, CONNECTOR);
      await admin.from("drive_sync_folders").delete().eq("user_id", user.id);
      return json({ connected: false });
    }

    if (body.action === "status") {
      const res = await drive("/drive/v3/about?fields=user(emailAddress,displayName)");
      if (await appUserReconnectRequired(res)) return json({ connected: false, reconnectRequired: true });
      if (!res.ok) { console.error("about", res.status, await res.text()); return json({ error: "Google Drive ne répond pas" }, 502); }
      const about = await res.json();
      const { data: folder } = await admin.from("drive_sync_folders").select("*").eq("user_id", user.id).maybeSingle();
      return json({ connected: true, email: about.user?.emailAddress ?? null, name: about.user?.displayName ?? null, folder });
    }

    if (body.action === "folders") {
      const parent = body.parentId ?? "root";
      const params = new URLSearchParams({
        q: `'${parent}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
        pageSize: "200", orderBy: "name", fields: "files(id,name)",
      });
      const res = await drive(`/drive/v3/files?${params}`);
      if (await appUserReconnectRequired(res)) return json({ connected: false, reconnectRequired: true });
      if (!res.ok) { console.error("folders", res.status, await res.text()); return json({ error: "Impossible de lister tes dossiers" }, 502); }
      return json({ connected: true, folders: (await res.json()).files ?? [] });
    }

    if (body.action === "setFolder") {
      const { error } = await admin.from("drive_sync_folders").upsert(
        { user_id: user.id, folder_id: body.folderId, folder_name: body.folderName, last_error: null },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      const result = await syncFolder(drive, user.id);
      return json({ connected: true, ...result });
    }

    if (body.action === "clearFolder") {
      await admin.from("drive_sync_folders").delete().eq("user_id", user.id);
      return json({ connected: true });
    }

    if (body.action === "syncNow") {
      return json({ connected: true, ...(await syncFolder(drive, user.id)) });
    }

    if (body.action === "list") {
      const types = body.type && body.type !== "all" ? [MIME[body.type]] : Object.values(MIME);
      let q = `trashed = false and (${types.map((m) => `mimeType = '${m}'`).join(" or ")})`;
      if (body.search?.trim()) q += ` and name contains '${body.search.trim().replace(/['\\]/g, "\\$&")}'`;
      const params = new URLSearchParams({
        q, pageSize: "50", orderBy: "modifiedTime desc",
        fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime)",
      });
      if (body.pageToken) params.set("pageToken", body.pageToken);
      const res = await drive(`/drive/v3/files?${params}`);
      if (await appUserReconnectRequired(res)) return json({ connected: false, reconnectRequired: true });
      if (!res.ok) { console.error("list", res.status, await res.text()); return json({ error: "Impossible de lister tes fichiers" }, 502); }
      const data = await res.json();
      return json({ connected: true, files: data.files ?? [], nextPageToken: data.nextPageToken ?? null });
    }

    if (body.action === "import") {
      return json({ ok: true, ...(await importDriveFile(drive, user.id, body.fileId)) });
    }
    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    if (e instanceof DriveError) return json(e.reconnect ? { connected: false, reconnectRequired: true } : { error: e.message }, e.reconnect ? 200 : e.status);
    console.error("google-drive error", e);
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
