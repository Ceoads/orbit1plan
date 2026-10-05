import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { aiChat } from "../_shared/ai.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

type Msg = { role: "user" | "assistant"; content: string };
type Route = "gemini" | "gpt" | "claude";

/** Orbit picks the best model for the request; students never see which one. */
function pickRoute(text: string): Route {
  const t = text.toLowerCase();
  if (/(code|python|java|sql|algo|fonction|programm|bug|équation|equation|intégrale|integrale|dérivée|derivee|démontr|demontr|calcul|probabilit|matrice|physique|chimie|exercice de maths|résous|resous|\d+\s*[x×*/^+-]\s*\d+)/.test(t)) return "gpt";
  if (t.length > 600 || /(dissertation|rédige|redige|rédaction|redaction|essai|commentaire|lettre|mémoire|memoire|reformule|résumé détaillé|plan détaillé|argument|philosoph|analyse de texte|corrige mon texte)/.test(t)) return "claude";
  return "gemini";
}

/** Returns a stream of text deltas, or null if the provider failed before streaming. */
async function callModel(route: Route, system: string, msgs: Msg[]): Promise<{ body: ReadableStream<Uint8Array>; parse: (d: string) => string | null } | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (route === "gpt" && key) {
    const res = await fetch(`${GATEWAY}/responses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: "openai/gpt-6-astra", instructions: system, input: msgs, stream: true, store: false, reasoning: { effort: "low" } }),
    });
    if (res.ok && res.body) return { body: res.body, parse: (d) => { const j = JSON.parse(d); return j.type === "response.output_text.delta" ? j.delta : null; } };
    console.log(JSON.stringify({ fn: "orbit-ai", route, status: res.status, body: (await res.text().catch(() => "")).slice(0, 300) }));
    return null;
  }
  if (route === "claude" && key) {
    const res = await fetch(`${GATEWAY}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: "anthropic/claude-sonnet-5", system, messages: msgs, max_tokens: 4096, stream: true }),
    });
    if (res.ok && res.body) return { body: res.body, parse: (d) => { const j = JSON.parse(d); return j.type === "content_block_delta" ? j.delta?.text ?? null : null; } };
    console.log(JSON.stringify({ fn: "orbit-ai", route, status: res.status, body: (await res.text().catch(() => "")).slice(0, 300) }));
    return null;
  }
  const res = await aiChat({ model: "google/gemini-3.8-flash", stream: true, messages: [{ role: "system", content: system }, ...msgs] });
  if (res.ok && res.body) return { body: res.body, parse: (d) => JSON.parse(d).choices?.[0]?.delta?.content ?? null };
  console.log(JSON.stringify({ fn: "orbit-ai", route: "gemini", status: res.status }));
  return null;
}

/** Non-streamed helper (Gemini) for titles and memory summaries. */
async function quick(prompt: string): Promise<string> {
  const res = await aiChat({ model: "google/gemini-3.8-flash", messages: [{ role: "user", content: prompt }] });
  if (!res.ok) return "";
  const j = await res.json().catch(() => null);
  return String(j?.choices?.[0]?.message?.content ?? "").trim();
}

async function activeConversation(admin: SupabaseClient, userId: string): Promise<string> {
  const { data } = await admin.from("ai_conversations").select("id").eq("user_id", userId).eq("archived", false).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (data) return data.id;
  const { data: c } = await admin.from("ai_conversations").insert({ user_id: userId }).select("id").single();
  // Attach legacy messages (from before conversations existed).
  await admin.from("ai_chat_messages").update({ conversation_id: c!.id }).eq("user_id", userId).is("conversation_id", null);
  return c!.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Non connecté" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Non connecté" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));

    if (body.action === "active") return json({ conversationId: await activeConversation(admin, user.id) });

    if (body.action === "resume" && typeof body.conversationId === "string") {
      const { data: c } = await admin.from("ai_conversations").select("id").eq("id", body.conversationId).eq("user_id", user.id).maybeSingle();
      if (!c) return json({ error: "Conversation introuvable" }, 404);
      await admin.from("ai_conversations").update({ archived: true }).eq("user_id", user.id).eq("archived", false);
      await admin.from("ai_conversations").update({ archived: false, updated_at: new Date().toISOString() }).eq("id", c.id);
      return json({ conversationId: c.id });
    }

    if (body.action === "new") {
      // Archive the current conversation and keep what matters as hidden memory.
      const cur = await activeConversation(admin, user.id);
      const { data: msgs } = await admin.from("ai_chat_messages").select("role,content").eq("conversation_id", cur).order("created_at").limit(60);
      if (msgs?.length) {
        const transcript = msgs.map((m) => `${m.role === "user" ? "Étudiant" : "Orbit"} : ${m.content.slice(0, 800)}`).join("\n");
        const [title, memory] = await Promise.all([
          quick(`Donne un titre très court (5 mots max, sans guillemets) à cette conversation :\n${transcript.slice(0, 4000)}`),
          quick(`Extrais en 1 à 4 puces courtes ce qu'il faut retenir sur l'étudiant pour l'aider plus tard (objectifs, difficultés, préférences, faits importants). Si rien d'utile, réponds "RIEN".\n\n${transcript.slice(0, 8000)}`),
        ]);
        await admin.from("ai_conversations").update({ title: (title || "Conversation").slice(0, 80) }).eq("id", cur);
        if (memory && !/^rien/i.test(memory)) await admin.from("ai_memories").insert({ user_id: user.id, content: memory.slice(0, 1000), conversation_id: cur });
        await admin.from("ai_conversations").update({ archived: true }).eq("id", cur);
      }
      return json({ conversationId: await activeConversation(admin, user.id) });
    }

    const text = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";
    if (!text) return json({ error: "Message vide" }, 400);
    const convId = await activeConversation(admin, user.id);

    const today = new Date().toISOString().slice(0, 10);
    const [hist, subjects, events, tasks, grades, memories] = await Promise.all([
      admin.from("ai_chat_messages").select("role,content").eq("conversation_id", convId).order("created_at", { ascending: false }).limit(30),
      admin.from("subjects").select("id,name").eq("user_id", user.id),
      admin.from("calendar_events").select("title,event_date,start_time,end_time,room_number").eq("user_id", user.id).gte("event_date", today).order("event_date").limit(25),
      admin.from("tasks").select("title,due_date").eq("user_id", user.id).eq("status", "todo").order("due_date").limit(25),
      admin.from("grades").select("label,value,max_value,coefficient,subject_id").eq("user_id", user.id).order("grade_date", { ascending: false }).limit(30),
      admin.from("ai_memories").select("content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    const sName = (id: string | null) => subjects.data?.find((s) => s.id === id)?.name ?? "";
    const context = [
      `Date : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
      `Matières : ${(subjects.data ?? []).map((s) => s.name).join(", ") || "aucune"}`,
      `Prochains cours :\n${(events.data ?? []).map((e) => `- ${e.event_date} ${e.start_time?.slice(0, 5)}-${e.end_time?.slice(0, 5)} ${e.title}${e.room_number ? ` (${e.room_number})` : ""}`).join("\n") || "aucun"}`,
      `Tâches à faire :\n${(tasks.data ?? []).map((t) => `- ${t.title}${t.due_date ? ` (échéance ${t.due_date.slice(0, 10)})` : ""}`).join("\n") || "aucune"}`,
      `Notes :\n${(grades.data ?? []).map((g) => `- ${sName(g.subject_id)} · ${g.label} : ${g.value}/${g.max_value} (coef ${g.coefficient})`).join("\n") || "aucune"}`,
      `Mémoire des conversations passées :\n${(memories.data ?? []).map((m) => m.content).join("\n") || "aucune"}`,
    ].join("\n\n");
    const system = `Tu es Orbit AI, l'assistant d'études bienveillant d'un étudiant qui a du mal à s'organiser. Ne révèle jamais quel modèle d'IA tu es : tu es simplement Orbit AI. Réponds dans la langue de l'étudiant (français par défaut), de façon claire, concise et encourageante, en Markdown. Découpe les grosses tâches en petites étapes. Utilise ces données de l'étudiant quand c'est utile, sans les inventer :\n\n${context}`;

    await admin.from("ai_chat_messages").insert({ user_id: user.id, conversation_id: convId, role: "user", content: text });
    await admin.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    const msgs: Msg[] = [...((hist.data ?? []) as Msg[]).reverse(), { role: "user", content: text }];

    const route = pickRoute(text);
    let up = await callModel(route, system, msgs);
    if (!up && route !== "gemini") up = await callModel("gemini", system, msgs);
    if (!up) return json({ error: "Orbit AI est indisponible pour le moment, réessaie dans un instant." }, 503);
    console.log(JSON.stringify({ fn: "orbit-ai", user: user.id, route }));

    let full = "";
    const reader = up.body.getReader();
    const parse = up.parse;
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
              if (!d || d === "[DONE]") continue;
              try { const delta = parse(d); if (delta) { full += delta; ctrl.enqueue(enc.encode(delta)); } } catch { /* partial */ }
            }
          }
        } finally {
          if (full) await admin.from("ai_chat_messages").insert({ user_id: user.id, conversation_id: convId, role: "assistant", content: full });
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
