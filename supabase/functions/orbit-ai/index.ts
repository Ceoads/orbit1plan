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
type Provider = "gemini" | "openai" | "claude" | "gemini-image";
type Admin = SupabaseClient;

const providerOf = (r: Route): Provider => (r === "gpt" ? "openai" : r);

/** Each AI has its own budget: one provider's limit never blocks the others. */
async function isBlocked(admin: Admin, p: Provider): Promise<boolean> {
  const { data } = await admin.from("ai_provider_usage").select("blocked_until").eq("provider", p).order("day", { ascending: false }).limit(1).maybeSingle();
  return !!data?.blocked_until && new Date(data.blocked_until) > new Date();
}
async function track(admin: Admin, p: Provider, status: number, err = "") {
  const ok = status >= 200 && status < 300;
  // Quota/credit errors pause only that provider (1 h); other errors are just counted.
  const block = status === 402 || status === 429 || (status === 403 && /quota|credit|billing/i.test(err)) ? 60 : 0;
  await admin.rpc("track_ai_usage", { _provider: p, _ok: ok, _error: ok ? null : `${status} ${err.slice(0, 200)}`, _block_minutes: block });
}

/** Orbit picks the best model for the request; students never see which one. */
function pickRoute(text: string, voice: boolean): Route {
  if (voice) return "gpt";
  const t = text.toLowerCase();
  if (/(code|python|java|sql|algo|fonction|programm|bug|équation|equation|intégrale|integrale|dérivée|derivee|démontr|demontr|calcul|probabilit|matrice|physique|chimie|exercice de maths|résous|resous|\d+\s*[x×*/^+-]\s*\d+)/.test(t)) return "gpt";
  if (t.length > 600 || /(dissertation|rédige|redige|rédaction|redaction|essai|commentaire|lettre|mémoire|memoire|reformule|résumé détaillé|plan détaillé|argument|philosoph|analyse de texte|corrige mon texte)/.test(t)) return "claude";
  return "gemini";
}

export function wantsImage(text: string): boolean {
  return /(dessine|fais(-| )moi un (dessin|schéma|schema)|un dessin|schéma|schema|diagramme|illustr|génère une image|genere une image|crée une image|cree une image|image de|carte mentale|infographie|\bdraw\b|diagram|picture of)/i.test(text);
}

/** Gemini image generation on the project's Gemini key; returns a public image URL. */
async function generateImage(admin: Admin, userId: string, prompt: string): Promise<string | null> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key || await isBlocked(admin, "gemini-image")) return null;
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent", {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `Crée une illustration pédagogique claire et propre pour un étudiant. Style doux, fond clair, tons pêche/crème, lisible. Si du texte est nécessaire, en français et bien orthographié. Demande : ${prompt}` }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });
  const raw = await res.text();
  await track(admin, "gemini-image", res.status, res.ok ? "" : raw);
  if (!res.ok) { console.log(JSON.stringify({ fn: "orbit-ai", image: res.status, body: raw.slice(0, 300) })); return null; }
  const parts = JSON.parse(raw)?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: any) => p.inlineData?.data);
  if (!img) return null;
  const bytes = Uint8Array.from(atob(img.inlineData.data), (c) => c.charCodeAt(0));
  const mime = img.inlineData.mimeType || "image/png";
  const path = `${userId}/orbit-images/${crypto.randomUUID()}.${mime.split("/")[1] || "png"}`;
  const { error } = await admin.storage.from("notes").upload(path, bytes, { contentType: mime });
  if (error) { console.log(JSON.stringify({ fn: "orbit-ai", upload: error.message })); return null; }
  // Le bucket "notes" est privé : on renvoie un lien signé longue durée (10 ans)
  // pour que l'image reste visible dans le chat et l'historique.
  const { data: signed, error: signErr } = await admin.storage
    .from("notes")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr || !signed?.signedUrl) {
    console.log(JSON.stringify({ fn: "orbit-ai", sign: signErr?.message }));
    return null;
  }
  return signed.signedUrl;
}

type Up = { body: ReadableStream<Uint8Array>; parse: (d: string) => string | null };

/** Returns a stream of text deltas, or null if the provider failed (or is paused) before streaming. */
async function callModel(admin: Admin, route: Route, system: string, msgs: Msg[], voice = false): Promise<Up | null> {
  const p = providerOf(route);
  if (await isBlocked(admin, p)) return null;
  const responsesParse = (d: string) => { const j = JSON.parse(d); return j.type === "response.output_text.delta" ? j.delta : null; };

  if (route === "gpt") {
    // ChatGPT runs on the owner's own OpenAI key.
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return null;
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: voice ? "gpt-5.4-mini" : "gpt-5.4",
        instructions: voice ? `${system}\n\nMODE VOCAL : tu parles à voix haute. Réponds en 1 à 4 phrases courtes et naturelles, sans Markdown, sans listes, sans emojis, sans formules LaTeX.` : system,
        input: msgs, stream: true, store: false, reasoning: { effort: voice ? "low" : "medium" },
      }),
    });
    const err = res.ok ? "" : await res.text().catch(() => "");
    await track(admin, p, res.status, err);
    if (res.ok && res.body) return { body: res.body, parse: responsesParse };
    console.log(JSON.stringify({ fn: "orbit-ai", route, status: res.status, body: err.slice(0, 300) }));
    return null;
  }
  if (route === "claude") {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return null;
    const res = await fetch(`${GATEWAY}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: "anthropic/claude-sonnet-5", system, messages: msgs, max_tokens: 4096, stream: true }),
    });
    const err = res.ok ? "" : await res.text().catch(() => "");
    await track(admin, p, res.status, err);
    if (res.ok && res.body) return { body: res.body, parse: (d) => { const j = JSON.parse(d); return j.type === "content_block_delta" ? j.delta?.text ?? null : null; } };
    console.log(JSON.stringify({ fn: "orbit-ai", route, status: res.status, body: err.slice(0, 300) }));
    return null;
  }
  const sys = voice ? `${system}\n\nMODE VOCAL : réponds en 1 à 4 phrases courtes, sans Markdown.` : system;
  const res = await aiChat({ model: "google/gemini-3.8-flash", stream: true, messages: [{ role: "system", content: sys }, ...msgs] });
  await track(admin, "gemini", res.status, res.ok ? "" : await res.clone().text().catch(() => ""));
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

    if (body.action === "usage") {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Accès réservé" }, 403);
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await admin.from("ai_provider_usage").select("*").eq("day", today);
      return json({ usage: data ?? [] });
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

    const voice = body.voice === true;
    let imageUrl: string | null = null;
    let sys = system;
    if (!voice && wantsImage(text)) {
      imageUrl = await generateImage(admin, user.id, text);
      sys += imageUrl
        ? "\n\nUne illustration correspondant à la demande vient d'être générée et s'affiche juste au-dessus de ta réponse. Présente-la en 2 à 4 phrases (ce qu'elle montre, comment l'utiliser pour réviser). N'insère pas d'image toi-même."
        : "\n\nL'étudiant demande une image mais elle n'a pas pu être générée. Dis-le brièvement puis explique avec du texte (schéma en liste ou tableau Markdown).";
    }

    const route = pickRoute(text, voice);
    const order: Route[] = [route, ...(["gpt", "gemini", "claude"] as Route[]).filter((r) => r !== route)];
    let up: Up | null = null;
    let used: Route = route;
    for (const r of order) { up = await callModel(admin, r, sys, msgs, voice); if (up) { used = r; break; } }
    if (!up) return json({ error: "Orbit AI est indisponible pour le moment, réessaie dans un instant." }, 503);
    console.log(JSON.stringify({ fn: "orbit-ai", user: user.id, route: used, voice, image: !!imageUrl }));

    const prefix = imageUrl ? `![Illustration Orbit](${imageUrl})\n\n` : "";
    let full = prefix;
    const reader = up.body.getReader();
    const parse = up.parse;
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        if (prefix) ctrl.enqueue(enc.encode(prefix));
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
