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
]);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Connexion requise" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Connexion requise" }, 401);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
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

    const drive = (path: string) =>
      callAsAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: CONNECTOR, path, requiredScopes: GOOGLE_DRIVE_SCOPES });

    if (body.action === "disconnect") {
      await disconnectAppUser({ gatewayBaseUrl: GATEWAY, connectionAPIKey: key, connectorId: CONNECTOR }).catch((e) => console.error(e));
      await deleteConnectionForUser(user.id, CONNECTOR);
      return json({ connected: false });
    }

    if (body.action === "status") {
      const res = await drive("/drive/v3/about?fields=user(emailAddress,displayName)");
      if (await appUserReconnectRequired(res)) return json({ connected: false, reconnectRequired: true });
      if (!res.ok) { console.error("about", res.status, await res.text()); return json({ error: "Google Drive ne répond pas" }, 502); }
      const about = await res.json();
      return json({ connected: true, email: about.user?.emailAddress ?? null, name: about.user?.displayName ?? null });
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

    // import
    const metaRes = await drive(`/drive/v3/files/${body.fileId}?fields=id,name,mimeType,size,webViewLink`);
    if (await appUserReconnectRequired(metaRes)) return json({ connected: false, reconnectRequired: true });
    if (!metaRes.ok) return json({ error: "Fichier introuvable" }, 404);
    const meta = await metaRes.json();
    if (!Object.values(MIME).includes(meta.mimeType)) return json({ error: "Type de fichier non pris en charge" }, 415);
    if (meta.size && Number(meta.size) > MAX_BYTES) return json({ error: "Fichier trop lourd (plus de 50 Mo)" }, 413);

    let bytes: Uint8Array; let ext: string; let contentType: string; let extractedText: string | null = null;
    if (meta.mimeType === MIME.gdoc) {
      const [pdfRes, txtRes] = await Promise.all([
        drive(`/drive/v3/files/${body.fileId}/export?mimeType=${encodeURIComponent(MIME.pdf)}`),
        drive(`/drive/v3/files/${body.fileId}/export?mimeType=text%2Fplain`),
      ]);
      if (!pdfRes.ok) return json({ error: "Export du document impossible" }, 502);
      bytes = new Uint8Array(await pdfRes.arrayBuffer()); ext = "pdf"; contentType = MIME.pdf;
      if (txtRes.ok) extractedText = (await txtRes.text()).slice(0, 200000);
    } else {
      const res = await drive(`/drive/v3/files/${body.fileId}?alt=media`);
      if (!res.ok) return json({ error: "Téléchargement impossible" }, 502);
      bytes = new Uint8Array(await res.arrayBuffer());
      ext = meta.mimeType === MIME.pdf ? "pdf" : "docx"; contentType = meta.mimeType;
    }
    if (bytes.byteLength > MAX_BYTES) return json({ error: "Fichier trop lourd (plus de 50 Mo)" }, 413);

    const admin = adminClient();
    const path = `${user.id}/drive-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const up = await admin.storage.from("notes").upload(path, bytes, { contentType });
    if (up.error) throw up.error;
    const { data: signed } = await admin.storage.from("notes").createSignedUrl(path, 60 * 60 * 24 * 365);
    const name = meta.name.endsWith(`.${ext}`) ? meta.name : `${meta.name}.${ext}`;
    const { data: row, error } = await admin.from("vault_files").insert({
      user_id: user.id, file_url: signed?.signedUrl ?? path, original_filename: name,
      file_type: ext === "pdf" ? "pdf" : "document", extracted_text: extractedText,
      filing_status: "confirmed", tags: ["drive", ext],
    }).select("id").single();
    if (error) throw error;
    console.log(JSON.stringify({ event: "drive.import", user: user.id, file: body.fileId, source: meta.webViewLink, at: new Date().toISOString() }));
    return json({ ok: true, id: row.id, name });
  } catch (e) {
    console.error("google-drive error", e);
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
