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
  let m = model.replace(/^google\//, '');
  // Preview models that only exist on the Lovable gateway.
  if (m.startsWith('gemini-3-')) m = 'gemini-2.5-flash';
  return m;
}

// Drop-in replacement for a chat-completions fetch call.
export async function aiChat(body: Record<string, unknown>): Promise<Response> {
  const { url, key, provider } = aiEndpoint();
  const model = aiModel(String(body.model ?? 'google/gemini-2.5-flash'), provider);
  return await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, model }),
  });
}
