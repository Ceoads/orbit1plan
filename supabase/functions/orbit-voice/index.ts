import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const FALLBACK_VOICE = "EXAVITQu4vr4xnSDxMaL"; // Sarah, used only if the "Orbit" voice is missing
let cachedVoice: string | null = null;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Finds the voice named "Orbit" in the connected ElevenLabs account (cached per instance). */
async function orbitVoiceId(key: string): Promise<string> {
  if (cachedVoice) return cachedVoice;
  try {
    const r = await fetch("https://api.elevenlabs.io/v2/voices?search=orbit&page_size=50", { headers: { "xi-api-key": key } });
    let voices: { voice_id: string; name: string }[] = r.ok ? (await r.json()).voices ?? [] : [];
    if (!voices.length) {
      const r1 = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
      if (r1.ok) voices = (await r1.json()).voices ?? [];
    }
    const match = voices.find((v) => v.name.trim().toLowerCase() === "orbit") ?? voices.find((v) => v.name.toLowerCase().includes("orbit"));
    if (match) { cachedVoice = match.voice_id; return match.voice_id; }
    console.error("Voice 'Orbit' not found; using fallback");
  } catch (e) { console.error("voice lookup failed", e); }
  return FALLBACK_VOICE;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "Non autorisé" }, 401);

    const key = Deno.env.get("ELEVENLABS_API_KEY");
    if (!key) return json({ error: "Voix non configurée" }, 500);

    const { text, previous_text } = await req.json();
    if (typeof text !== "string" || !text.trim()) return json({ error: "Texte manquant" }, 400);
    const voice = await orbitVoiceId(key);

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128&optimize_streaming_latency=3`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.slice(0, 1200),
        model_id: "eleven_flash_v2_5",
        language_code: "fr",
        ...(typeof previous_text === "string" && previous_text ? { previous_text: previous_text.slice(-300) } : {}),
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
