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
  return 'gemini-3.6-flash';
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
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.6-flash'];
export async function aiFetch(url: string, init: RequestInit): Promise<Response> {
  let body: any = null;
  try { body = init.body ? JSON.parse(String(init.body)) : null; } catch { /* keep raw */ }
  let res: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    let reqInit = init;
    if (attempt > 0 && body && url.includes('generativelanguage') && !String(body.model).includes('image')) {
      reqInit = { ...init, body: JSON.stringify({ ...body, model: FALLBACK_MODELS[(attempt - 1) % FALLBACK_MODELS.length] }) };
    }
    res = await fetch(url, reqInit);
    if (res.ok || !(res.status === 429 || res.status >= 500)) return res;
    await res.text().catch(() => null);
    await new Promise((r) => setTimeout(r, 800 * 2 ** attempt + Math.random() * 400));
  }
  return res!;
}
