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
import { aiChat } from "../_shared/ai.ts";

const GATEWAY = "https://connector-gateway.lovable.dev";
const CONNECTOR = "google_drive";
const ALLOWED_APP_ORIGINS = new Set([
  "https://orbit-plan.com",
  "https://www.orbit-plan.com",
  "https://orbitp1an.lovable.app",
  "https://id-preview--dc23bc90-363b-4525-b605-b15310eb5d99.lovable.app",
  "http://localhost:8080",
]);
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
  z.object({ action: z.literal("import"), fileId: z.string().regex(/^[\w-]{5,200}$/), subjectId: z.string().uuid().optional() }),
  z.object({ action: z.literal("disconnect") }),
  z.object({ action: z.literal("folders"), parentId: z.string().regex(/^[\w-]{1,200}$/).optional() }),
  z.object({ action: z.literal("setFolder"), folderId: z.string().regex(/^[\w-]{1,200}$/), folderName: z.string().min(1).max(300) }),
  z.object({ action: z.literal("clearFolder") }),
  z.object({ action: z.literal("syncNow") }),
  z.object({ action: z.literal("syncAll") }),
  z.object({ action: z.literal("autoFile") }),
]);

// ---------- Auto-classement : nom de fichier / dossier + emploi du temps iCal ----------
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const STOP = new Set(["de", "des", "du", "la", "le", "les", "et", "en", "a", "au", "aux", "d", "l", "cours", "td", "tp", "cm"]);

type Subj = { id: string; name: string; ical_code: string | null };
type Ev = { subject_id: string | null; event_date: string | null; start_time: string; end_time: string };

function parisParts(iso: string) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function classify(subjects: Subj[], events: Ev[], texts: string[], whenIso?: string | null): { id: string; how: string } | null {
  const hay = ` ${norm(texts.join(" "))} `;
  let best: { id: string; score: number } | null = null;
  for (const s of subjects) {
    let score = 0;
    const full = norm(s.name);
    if (full && hay.includes(` ${full} `)) score += 10;
    if (s.ical_code && hay.includes(` ${norm(s.ical_code)} `)) score += 8;
    for (const w of full.split(" ")) if (w.length > 3 && !STOP.has(w) && hay.includes(` ${w} `)) score += 2;
    if (score > 0 && (!best || score > best.score)) best = { id: s.id, score };
  }
  if (best && best.score >= 2) return { id: best.id, how: "name" };
  if (!whenIso) return null;
  const { date, minutes } = parisParts(whenIso);
  const day = events.filter((e) => e.event_date === date && e.subject_id);
  // pendant le cours (ou jusqu'à 45 min après), sinon le cours le plus proche du jour (< 3 h)
  const during = day.find((e) => minutes >= toMin(e.start_time) - 10 && minutes <= toMin(e.end_time) + 45);
  if (during) return { id: during.subject_id!, how: "ical" };
  let near: { id: string; d: number } | null = null;
  for (const e of day) {
    const d = Math.min(Math.abs(minutes - toMin(e.start_time)), Math.abs(minutes - toMin(e.end_time)));
    if (d <= 180 && (!near || d < near.d)) near = { id: e.subject_id!, d };
  }
  return near ? { id: near.id, how: "ical" } : null;
}

const b64 = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const AI_PDF_MAX = 8 * 1024 * 1024;

// Lit le contenu (texte ou PDF) avec Gemini et choisit la matière la plus probable.
async function aiClassify(subjects: Subj[], doc: { name: string; folder?: string; text?: string | null; pdf?: Uint8Array | null }): Promise<{ id: string; summary: string } | null> {
  if (!subjects.length) return null;
  try {
    const list = subjects.map((s, i) => `${i + 1}. ${s.name}${s.ical_code ? ` (${s.ical_code})` : ""}`).join("\n");
    const content: unknown[] = [{ type: "text", text:
      `Voici les matières d'un étudiant :\n${list}\n\nDocument : « ${doc.name} »${doc.folder ? ` (dossier Drive « ${doc.folder} »)` : ""}.\n` +
      (doc.text ? `Extrait du contenu :\n${doc.text.slice(0, 6000)}\n` : "") +
      `Lis le contenu et réponds UNIQUEMENT en JSON : {"match": <numéro de la matière ou 0 si aucune ne correspond clairement>, "confidence": <0-1>, "summary": "<résumé d'une phrase dans la langue du document>"}` }];
    if (!doc.text && doc.pdf && doc.pdf.byteLength <= AI_PDF_MAX) content.push({ type: "image_url", image_url: { url: `data:application/pdf;base64,${b64(doc.pdf)}` } });
    const res = await aiChat({ model: "google/gemini-3.8-flash", messages: [{ role: "user", content }], response_format: { type: "json_object" } });
    if (!res.ok) { console.log(JSON.stringify({ event: "drive.ai.error", status: res.status })); return null; }
    const out = await res.json();
    const raw = String(out.choices?.[0]?.message?.content ?? "");
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    const idx = Number(parsed.match) - 1;
    if (idx < 0 || idx >= subjects.length || Number(parsed.confidence ?? 0) < 0.55) return null;
    return { id: subjects[idx].id, summary: String(parsed.summary ?? "").slice(0, 400) };
  } catch (e) { console.log(JSON.stringify({ event: "drive.ai.fail", err: String(e) })); return null; }
}

async function loadClassifier(userId: string) {
  const admin = adminClient();
  const [{ data: subjects }, { data: events }] = await Promise.all([
    admin.from("subjects").select("id,name,ical_code").eq("user_id", userId),
    admin.from("calendar_events").select("subject_id,event_date,start_time,end_time").eq("user_id", userId).not("event_date", "is", null),
  ]);
  return { subjects: (subjects ?? []) as Subj[], events: (events ?? []) as Ev[] };
}

type DriveFn = (path: string) => Promise<Response>;
const MAX_PER_SYNC = 25;

class DriveError extends Error { constructor(msg: string, public status: number, public reconnect = false) { super(msg); } }

async function importDriveFile(drive: DriveFn, userId: string, fileId: string, subjectId?: string) {
  const admin = adminClient();
  if (subjectId) {
    const { data: owned } = await admin.from("subjects").select("id").eq("id", subjectId).eq("user_id", userId).maybeSingle();
    if (!owned) throw new DriveError("Matière introuvable", 404);
  }
  const metaRes = await drive(`/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink,createdTime,modifiedTime,parents`);
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

  let finalSubject = subjectId ?? null; let how = subjectId ? "manual" : ""; let summary: string | null = null;
  if (!finalSubject) {
    const texts = [meta.name];
    const parent = meta.parents?.[0];
    if (parent) {
      const pr = await drive(`/drive/v3/files/${parent}?fields=name`);
      if (pr.ok) texts.push((await pr.json()).name ?? "");
    }
    const c = await loadClassifier(userId);
    const ai = await aiClassify(c.subjects, { name: meta.name, folder: texts[1], text: extractedText, pdf: ext === "pdf" ? bytes : null });
    if (ai) { finalSubject = ai.id; how = "ai"; summary = ai.summary || null; }
    else {
      const hit = classify(c.subjects, c.events, texts, meta.createdTime ?? meta.modifiedTime);
      if (hit) { finalSubject = hit.id; how = hit.how; }
    }
  }
  const path = `${userId}/drive-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const up = await admin.storage.from("notes").upload(path, bytes, { contentType });
  if (up.error) throw up.error;
  const { data: signed } = await admin.storage.from("notes").createSignedUrl(path, 60 * 60 * 24 * 365);
  const name = meta.name.endsWith(`.${ext}`) ? meta.name : `${meta.name}.${ext}`;
  const { data: row, error } = await admin.from("vault_files").insert({
    user_id: userId, subject_id: finalSubject, created_at: meta.createdTime ?? new Date().toISOString(), file_url: signed?.signedUrl ?? path, original_filename: name,
    file_type: ext === "pdf" ? "pdf" : "document", extracted_text: extractedText, ai_summary: summary,
    filing_status: how === "manual" || !finalSubject ? "confirmed" : "auto", tags: how && how !== "manual" ? ["drive", ext, `auto-${how}`] : ["drive", ext],
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
      const requestedOrigin = new URL(body.origin).origin;
      if (!ALLOWED_APP_ORIGINS.has(requestedOrigin)) {
        return json({ error: "Cette adresse Orbit n'est pas autorisée pour Google Drive." }, 400);
      }
      const existing = await getConnectionKeyForUser(user.id, CONNECTOR);
      const { authorizationUrl } = await authorizeAppUserOAuth({
        gatewayBaseUrl: GATEWAY, connectorId: CONNECTOR, appUserId: user.id, clientAPIKey,
        returnUrl: new URL("/oauth/google-drive/return", requestedOrigin).toString(),
        connectionAPIKey: existing ?? undefined,
        credentialsConfiguration: { scopes: GOOGLE_DRIVE_SCOPES },
      });
      return json({ authorizationUrl });
    }

    if (body.action === "autoFile") {
      const admin = adminClient();
      const c = await loadClassifier(user.id);
      const { data: rows } = await admin.from("vault_files").select("id,original_filename,created_at,tags,extracted_text,file_url,file_type")
        .eq("user_id", user.id).is("subject_id", null).contains("tags", ["drive"]);
      let filed = 0;
      for (const r of rows ?? []) {
        let pdf: Uint8Array | null = null;
        if (!r.extracted_text && r.file_type === "pdf" && r.file_url?.startsWith("http")) {
          try { const f = await fetch(r.file_url); if (f.ok) pdf = new Uint8Array(await f.arrayBuffer()); } catch { /* ignore */ }
        }
        const ai = await aiClassify(c.subjects, { name: r.original_filename ?? "", text: r.extracted_text, pdf });
        const hit = ai ? { id: ai.id, how: "ai" } : classify(c.subjects, c.events, [r.original_filename ?? "", (r.extracted_text ?? "").slice(0, 300)], r.created_at);
        if (!hit) continue;
        await admin.from("vault_files").update({ subject_id: hit.id, filing_status: "auto", tags: [...(r.tags ?? []), `auto-${hit.how}`], ...(ai?.summary ? { ai_summary: ai.summary } : {}) }).eq("id", r.id);
        filed++;
      }
      return json({ filed, total: rows?.length ?? 0 });
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
      if (!res.ok) {
        const text = await res.text();
        console.error("about", res.status, text);
        if (res.status === 403 && /SERVICE_DISABLED|accessNotConfigured/.test(text)) {
          return json({ connected: false, error: "L'API Google Drive n'est pas activée dans le projet Google Cloud. Active-la, patiente quelques minutes, puis réessaie." });
        }
        return json({ connected: false, error: `Google Drive a répondu ${res.status}` });
      }
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
      return json({ ok: true, ...(await importDriveFile(drive, user.id, body.fileId, body.subjectId)) });
    }
    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    if (e instanceof DriveError) return json(e.reconnect ? { connected: false, reconnectRequired: true } : { error: e.message }, e.reconnect ? 200 : e.status);
    console.error("google-drive error", e);
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue" }, 500);
  }
});
