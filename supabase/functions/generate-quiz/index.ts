import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting: max 5 requests per minute per user
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Structured logging with unique request id
  const reqId = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8);
  const t0 = Date.now();
  const log = (
    level: 'info' | 'warn' | 'error',
    step: string,
    data: Record<string, unknown> = {}
  ) => {
    const payload = {
      reqId,
      fn: 'generate-quiz',
      step,
      level,
      elapsed_ms: Date.now() - t0,
      ...data,
    };
    const line = JSON.stringify(payload);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };

  log('info', 'request.start', { method: req.method });

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      log('warn', 'auth.missing_header');
      return new Response(JSON.stringify({ error: 'Unauthorized', reqId }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      log('warn', 'auth.invalid', { error: userError?.message });
      return new Response(JSON.stringify({ error: 'Unauthorized', reqId }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    log('info', 'auth.ok', { userId: user.id });

    if (!checkRateLimit(user.id)) {
      log('warn', 'rate_limit.exceeded', { userId: user.id });
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.', reqId }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64, extractedText, noteId, subjectId } = await req.json();
    log('info', 'request.parsed', {
      noteId,
      subjectId,
      hasExtractedText: !!extractedText,
      extractedTextLen: extractedText?.length ?? 0,
      hasImageBase64: !!imageBase64,
      imageBase64Kind: imageBase64?.startsWith?.('data:')
        ? 'data-url'
        : imageBase64?.startsWith?.('http')
          ? 'http-url'
          : imageBase64 ? 'base64' : 'none',
    });

    if (!imageBase64 && !extractedText) {
      log('warn', 'validation.no_content');
      return new Response(
        JSON.stringify({ error: 'Image or extracted text is required', reqId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      log('error', 'config.missing_api_key');
      return new Response(
        JSON.stringify({ error: 'AI service not configured', reqId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    const systemPrompt = `Tu es un professeur expert en création de QCM pédagogiques. À partir du contenu fourni, tu dois créer un quiz de 5 questions à choix multiples.

RÈGLE DE LANGUE CRITIQUE :
Détecte automatiquement la langue du document/contenu source.
Réponds TOUJOURS dans la même langue que le contenu du document.
- Document en français → Génère le quiz en français
- Document en anglais → Génère le quiz en anglais
- Document en espagnol → Génère le quiz en espagnol
- Document mixte → Utilise la langue dominante
Ne jamais répondre dans une langue différente de celle du document source.

Retourne UNIQUEMENT un JSON valide avec cette structure exacte:
{
  "quiz": {
    "title": "Titre du quiz basé sur le sujet",
    "questions": [
      {
        "id": 1,
        "question": "Question claire et précise",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Explication courte de pourquoi c'est la bonne réponse"
      }
    ]
  }
}

Règles:
- Exactement 5 questions
- Chaque question a exactement 4 options
- Les options doivent être plausibles (pas de réponses évidemment fausses)
- "correctIndex" est l'index (0-3) de la bonne réponse
- Questions variées: définitions, applications, compréhension
- Adapte la difficulté au niveau du contenu
- Si le contenu est illisible, retourne {"quiz": null, "error": "Contenu non reconnu"}`;

    let messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Determine if imageBase64 is actually a valid base64 string or a URL
    const isValidBase64 = imageBase64 && (
      imageBase64.startsWith('data:') || 
      /^[A-Za-z0-9+/=]+$/.test(imageBase64.substring(0, 100))
    );
    const isUrl = imageBase64 && imageBase64.startsWith('http');

    // PRIORITY: Use extractedText if available (more reliable than image processing)
    if (extractedText && extractedText.length > 50) {
      log('info', 'content.mode', { mode: 'text', length: extractedText.length });
      messages.push({
        role: 'user',
        content: `Génère un QCM de 5 questions basé sur ce contenu de cours:\n\n${extractedText}`
      });
    } else if (isValidBase64) {
      // Limits for inline base64 payloads sent to Gemini (avoids timeouts / oversized requests)
      const MAX_INLINE_BYTES = 8 * 1024 * 1024; // 8 MB decoded
      const rawB64 = imageBase64.startsWith('data:')
        ? imageBase64.slice(imageBase64.indexOf(',') + 1)
        : imageBase64;
      const approxBytes = Math.round((rawB64.length * 3) / 4);
      log('info', 'content.mode', {
        mode: 'image-base64',
        hasDataPrefix: imageBase64.startsWith('data:'),
        approxBytes,
        maxBytes: MAX_INLINE_BYTES,
      });
      if (approxBytes > MAX_INLINE_BYTES) {
        log('warn', 'payload.too_large', { approxBytes, maxBytes: MAX_INLINE_BYTES });
        return new Response(
          JSON.stringify({
            error: `Document trop volumineux (${(approxBytes / 1024 / 1024).toFixed(1)} Mo). Limite ${(MAX_INLINE_BYTES / 1024 / 1024).toFixed(0)} Mo. Compresse l'image ou utilise l'extraction OCR.`,
            reqId,
          }),
          { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Analyse cette image de cours et génère un QCM de 5 questions.' },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    } else if (isUrl) {
      // Fetch the file and convert to data URL — Gemini doesn't accept arbitrary URLs
      // and only accepts PNG/JPEG/WebP/GIF as images. PDFs must be inlined as application/pdf.
      const MAX_INLINE_BYTES = 8 * 1024 * 1024; // 8 MB decoded
      log('info', 'fetch.start', { url: imageBase64.slice(0, 120), maxBytes: MAX_INLINE_BYTES });
      const fetchT0 = Date.now();
      try {
        // HEAD first to check size cheaply (best-effort)
        try {
          const headRes = await fetch(imageBase64, { method: 'HEAD' });
          const headLen = Number(headRes.headers.get('content-length') || 0);
          log('info', 'fetch.head', { status: headRes.status, contentLength: headLen });
          if (headLen && headLen > MAX_INLINE_BYTES) {
            log('warn', 'payload.too_large.head', { contentLength: headLen, maxBytes: MAX_INLINE_BYTES });
            return new Response(
              JSON.stringify({
                error: `Document trop volumineux (${(headLen / 1024 / 1024).toFixed(1)} Mo). Limite ${(MAX_INLINE_BYTES / 1024 / 1024).toFixed(0)} Mo. Découpe le PDF ou réduis l'image avant de relancer.`,
                reqId,
              }),
              { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (headErr) {
          log('warn', 'fetch.head.failed', { error: headErr instanceof Error ? headErr.message : String(headErr) });
        }

        const fileRes = await fetch(imageBase64);
        log('info', 'fetch.response', {
          status: fileRes.status,
          ok: fileRes.ok,
          contentType: fileRes.headers.get('content-type'),
          contentLength: fileRes.headers.get('content-length'),
          duration_ms: Date.now() - fetchT0,
        });
        if (!fileRes.ok) throw new Error(`fetch ${fileRes.status}`);
        const headerCt = fileRes.headers.get('content-type');
        const contentType = headerCt ||
          (imageBase64.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg');

        // Stream and enforce max size to avoid loading huge files into memory
        const reader = fileRes.body?.getReader();
        if (!reader) throw new Error('no response body');
        const chunks: Uint8Array[] = [];
        let total = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            total += value.byteLength;
            if (total > MAX_INLINE_BYTES) {
              try { await reader.cancel(); } catch (_) { /* noop */ }
              log('warn', 'payload.too_large.stream', { bytesSoFar: total, maxBytes: MAX_INLINE_BYTES });
              return new Response(
                JSON.stringify({
                  error: `Document trop volumineux (> ${(MAX_INLINE_BYTES / 1024 / 1024).toFixed(0)} Mo). Découpe le PDF en plusieurs parties ou compresse l'image.`,
                  reqId,
                }),
                { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            chunks.push(value);
          }
        }
        const buf = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) { buf.set(c, offset); offset += c.byteLength; }

        const encT0 = Date.now();
        // Chunked btoa to avoid call-stack overflow on large buffers
        let binary = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < buf.length; i += CHUNK) {
          binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
        }
        const b64 = btoa(binary);
        const dataUrl = `data:${contentType};base64,${b64}`;
        log('info', 'base64.encoded', {
          contentType,
          inferredFromHeader: !!headerCt,
          bytes: buf.length,
          base64Len: b64.length,
          duration_ms: Date.now() - encT0,
        });

        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: 'Analyse ce document de cours et génère un QCM de 5 questions.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        });
      } catch (e) {
        log('error', 'fetch.failed', {
          error: e instanceof Error ? e.message : String(e),
          duration_ms: Date.now() - fetchT0,
        });
        return new Response(
          JSON.stringify({ error: 'Impossible de récupérer le document. Réessaie après extraction OCR.', reqId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } else {
      log('warn', 'content.invalid');
      return new Response(
        JSON.stringify({ error: 'No valid content provided', reqId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const model = 'google/gemini-2.5-flash';
    log('info', 'ai.request', { model, messages: messages.length });
    const aiT0 = Date.now();
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages }),
    });
    log('info', 'ai.response', {
      status: response.status,
      ok: response.ok,
      duration_ms: Date.now() - aiT0,
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'ai.error', { status: response.status, body: errorText.slice(0, 500) });

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', reqId }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.', reqId }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate quiz', reqId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    log('info', 'ai.parsed', {
      contentLen: content.length,
      finishReason: data.choices?.[0]?.finish_reason,
      usage: data.usage,
    });

    // Parse the JSON response
    let quiz = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        quiz = parsed.quiz || null;
      }
      log('info', 'parse.ok', {
        matched: !!jsonMatch,
        hasQuiz: !!quiz,
        questions: quiz?.questions?.length ?? 0,
      });
    } catch (parseError) {
      log('error', 'parse.failed', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        contentSample: content.slice(0, 200),
      });
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', quiz: null, reqId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!quiz) {
      log('warn', 'parse.empty_quiz', { contentSample: content.slice(0, 200) });
      return new Response(
        JSON.stringify({ error: 'No quiz generated', quiz: null, reqId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', 'request.success', { questions: quiz.questions?.length ?? 0 });

    return new Response(
      JSON.stringify({ quiz, noteId, subjectId, reqId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log('error', 'request.unhandled', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.slice(0, 500) : undefined,
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', reqId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

