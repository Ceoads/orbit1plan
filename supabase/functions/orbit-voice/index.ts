import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah — multilingual, warm

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "Non autorisé" }, 401);

    const key = Deno.env.get("ELEVENLABS_API_KEY");
    if (!key) return json({ error: "Voix non configurée" }, 500);

    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) return json({ error: "Texte manquant" }, 400);
    const clean = text.slice(0, 2500);

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: clean,
        model_id: "eleven_turbo_v2_5",
        language_code: "fr",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
      }),
    });
    if (!r.ok) {
      const details = await r.text();
      console.error(`ElevenLabs [${r.status}]: ${details}`);
      return json({ error: "Voix indisponible", status: r.status, details }, r.status);
    }
    const d = await r.json();
    return json({ audio: d.audio_base64, alignment: d.alignment ?? d.normalized_alignment ?? null });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
