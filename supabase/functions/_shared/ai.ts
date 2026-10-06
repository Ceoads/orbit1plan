// Shared AI routing.
// Uses the project's own Gemini key when GEMINI_API_KEY is configured
// (required outside Lovable Cloud), otherwise falls back to the Lovable AI gateway.

const GEMINI_OPENAI_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const LOVABLE_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export function aiEndpoint(): { url: string; key: string; provider: 'gemini' | 'lovable' } {
  const gemini = Deno.env.get('GEMINI_API_KEY');
  if (gemini) return { url: GEMINI_OPENAI_URL, key: gemini, provider: 'gemini' };

  const lovable = Deno.env.get('LOVABLE_API_KEY');
  if (lovable) return { url: LOVABLE_URL, key: lovable, provider: 'lovable' };

  throw new Error('No AI key configured (set GEMINI_API_KEY)');
}

// Normalizes a model id for the active provider.
export function aiModel(model: string, provider: 'gemini' | 'lovable'): string {
  if (provider !== 'gemini') return model;
  const m = model.replace(/^google\//, '');
  // Map gateway model ids to models available on the Gemini API.
  if (m.includes('image')) return 'gemini-3.1-flash-image';
  return 'gemini-3.8-flash';
}

// Drop-in replacement for a chat-completions fetch call.
export async function aiChat(body: Record<string, unknown>): Promise<Response> {
  const { url, key, provider } = aiEndpoint();
  const model = aiModel(String(body.model ?? 'google/gemini-2.5-flash'), provider);
  return await aiFetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, model }),
  });
}

// Gemini is the default AI for every present and future feature.
// Resilient fetch: retries transient Gemini errors (429/5xx) with backoff and
// falls back to the stable "gemini-flash-latest" alias on retries.
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

// Gemini stays the default; when the project's Gemini quota is exhausted (or Gemini keeps
// failing) the same request is replayed once through the Lovable AI gateway so users aren't blocked.
async function lovableFallback(body: any, init: RequestInit): Promise<Response | null> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key || !body) return null;
  const model = String(body.model).includes('image') ? 'google/gemini-3.1-flash-image-preview' : 'google/gemini-3-flash-preview';
  console.warn('[ai] Gemini unavailable, falling back to Lovable AI gateway');
  return await fetch(LOVABLE_URL, {
    method: 'POST',
    signal: init.signal,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, model }),
  });
}

export async function aiFetch(url: string, init: RequestInit): Promise<Response> {
  let body: any = null;
  try { body = init.body ? JSON.parse(String(init.body)) : null; } catch { /* keep raw */ }
  const isGemini = url.includes('generativelanguage');
  let res: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    let reqInit = init;
    if (attempt > 0 && body && isGemini && !String(body.model).includes('image')) {
      reqInit = { ...init, body: JSON.stringify({ ...body, model: FALLBACK_MODELS[(attempt - 1) % FALLBACK_MODELS.length] }) };
    }
    res = await fetch(url, reqInit);
    if (res.ok || !(res.status === 429 || res.status >= 500)) return res;
    const errText = await res.clone().text().catch(() => '');
    // Daily/project quota: every Gemini model shares it, so retrying is pointless.
    const quotaExhausted = res.status === 429 && /PerDay|RESOURCE_EXHAUSTED|quota/i.test(errText);
    if (isGemini && (quotaExhausted || attempt === 3)) {
      const fb = await lovableFallback(body, init);
      if (fb) return fb;
      return res;
    }
    if (attempt === 3) return res;
    await new Promise((r) => setTimeout(r, 800 * 2 ** attempt + Math.random() * 400));
  }
  return res!;
}
