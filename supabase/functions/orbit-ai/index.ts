import { createClient } from "npm:@supabase/supabase-js@2";
import { aiChat } from "../_shared/ai.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Non connecté" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Non connecté" }, 401);
    const { message } = await req.json().catch(() => ({}));
    const text = typeof message === "string" ? message.trim().slice(0, 4000) : "";
    if (!text) return json({ error: "Message vide" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().slice(0, 10);
    const [hist, subjects, events, tasks, grades] = await Promise.all([
      admin.from("ai_chat_messages").select("role,content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      admin.from("subjects").select("id,name").eq("user_id", user.id),
      admin.from("calendar_events").select("title,event_date,start_time,end_time,room,event_type").eq("user_id", user.id).gte("event_date", today).order("event_date").limit(25),
      admin.from("tasks").select("title,due_date,is_completed").eq("user_id", user.id).eq("is_completed", false).order("due_date").limit(25),
      admin.from("grades").select("label,value,max_value,coefficient,grade_date,subject_id").eq("user_id", user.id).order("grade_date", { ascending: false }).limit(30),
    ]);
    const sName = (id: string | null) => subjects.data?.find((s) => s.id === id)?.name ?? "";
    const context = [
      `Date : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
      `Matières : ${(subjects.data ?? []).map((s) => s.name).join(", ") || "aucune"}`,
      `Prochains cours :\n${(events.data ?? []).map((e) => `- ${e.event_date} ${e.start_time?.slice(0, 5)}-${e.end_time?.slice(0, 5)} ${e.title}${e.room ? ` (${e.room})` : ""}`).join("\n") || "aucun"}`,
      `Tâches à faire :\n${(tasks.data ?? []).map((t) => `- ${t.title}${t.due_date ? ` (échéance ${t.due_date.slice(0, 10)})` : ""}`).join("\n") || "aucune"}`,
      `Notes :\n${(grades.data ?? []).map((g) => `- ${sName(g.subject_id)} · ${g.label} : ${g.value}/${g.max_value} (coef ${g.coefficient})`).join("\n") || "aucune"}`,
    ].join("\n\n");

    await admin.from("ai_chat_messages").insert({ user_id: user.id, role: "user", content: text });
    const history = (hist.data ?? []).reverse();
    const res = await aiChat({
      model: "google/gemini-3.8-flash",
      stream: true,
      messages: [
        { role: "system", content: `Tu es Orbit AI, l'assistant d'études bienveillant d'un étudiant qui a du mal à s'organiser. Réponds dans la langue de l'étudiant (français par défaut), de façon claire, concise et encourageante, en Markdown. Découpe les grosses tâches en petites étapes. Utilise ces données de l'étudiant quand c'est utile, sans les inventer :\n\n${context}` },
        ...history,
        { role: "user", content: text },
      ],
    });
    if (!res.ok || !res.body) {
      const status = res.status === 429 ? 429 : res.status === 402 ? 402 : 503;
      return json({ error: status === 429 ? "Orbit AI est très sollicité, réessaie dans un instant." : "Orbit AI est indisponible pour le moment." }, status);
    }

    let full = "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n"); buf = lines.pop() ?? "";
            for (const l of lines) {
              if (!l.startsWith("data:")) continue;
              const d = l.slice(5).trim();
              if (d === "[DONE]") continue;
              try {
                const delta = JSON.parse(d).choices?.[0]?.delta?.content;
                if (delta) { full += delta; ctrl.enqueue(enc.encode(delta)); }
              } catch { /* partial */ }
            }
          }
        } finally {
          if (full) await admin.from("ai_chat_messages").insert({ user_id: user.id, role: "assistant", content: full });
          ctrl.close();
        }
      },
    });
    return new Response(stream, { headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    console.log(JSON.stringify({ fn: "orbit-ai", err: String(e) }));
    return json({ error: "Erreur Orbit AI" }, 500);
  }
});
