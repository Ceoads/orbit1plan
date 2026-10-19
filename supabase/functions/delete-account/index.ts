import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Every table keyed by user_id, in an order safe for foreign keys.
const USER_TABLES = [
  "vault_filing_history",
  "drive_imported_files",
  "drive_sync_folders",
  "quiz_debug_runs",
  "ai_chat_messages",
  "ai_memories",
  "ai_conversations",
  "flashcards",
  "daily_notepads",
  "timeline_tasks",
  "tasks",
  "grades",
  "course_chapters",
  "calendar_events",
  "notes_vault",
  "vault_files",
  "semesters",
  "academic_years",
  "subjects",
  "app_user_connections",
  "subscribers",
  "user_settings",
  "user_roles",
  "profiles",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await anon.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "Non autorisé" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Remove stored files (notes bucket + avatar) before wiping rows.
    for (const bucket of ["notes", "avatars"]) {
      try {
        const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
        if (files?.length) {
          await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
        }
      } catch (e) {
        console.error(`storage cleanup ${bucket}`, e);
      }
    }

    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", user.id);
      if (error) console.error(`delete ${table}`, error.message);
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return json({ error: "Suppression impossible, réessaie plus tard." }, 500);

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: "Suppression impossible, réessaie plus tard." }, 500);
  }
});
