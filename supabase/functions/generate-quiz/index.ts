import { aiEndpoint, aiModel } from '../_shared/ai.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

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

// ---------- Helpers ----------

const TARGET_BYTES = 6 * 1024 * 1024; // soft target per inline payload (~6MB)
const HARD_MAX_BYTES = 18 * 1024 * 1024; // absolute ceiling (Gemini limit ~20MB)
const PAGES_PER_SEGMENT = 8; // split long PDFs
const MAX_SEGMENTS = 5; // cap to limit cost/latency

function bytesToB64(buf: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function compressImage(buf: Uint8Array, target = TARGET_BYTES): Promise<{ bytes: Uint8Array; mime: string; width: number; height: number; quality: number }> {
  const img = await Image.decode(buf);
  let w = img.width;
  let h = img.height;
  let quality = 80;
  // First pass: cap longest side at 1800px
  const MAX_DIM = 1800;
  if (Math.max(w, h) > MAX_DIM) {
    const scale = MAX_DIM / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    img.resize(w, h);
  }
  let out = await img.encodeJPEG(quality);
  // Iterative downscale if still too big
  let safety = 4;
  while (out.byteLength > target && safety-- > 0) {
    if (quality > 50) {
      quality -= 15;
    } else {
      w = Math.round(w * 0.8);
      h = Math.round(h * 0.8);
      img.resize(w, h);
    }
    out = await img.encodeJPEG(Math.max(quality, 40));
  }
  return { bytes: out, mime: 'image/jpeg', width: w, height: h, quality };
}

async function splitPdf(buf: Uint8Array, pagesPerSegment = PAGES_PER_SEGMENT): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const total = src.getPageCount();
  if (total <= pagesPerSegment) return [buf];
  const segments: Uint8Array[] = [];
  for (let start = 0; start < total; start += pagesPerSegment) {
    const end = Math.min(start + pagesPerSegment, total);
    const sub = await PDFDocument.create();
    const indices = Array.from({ length: end - start }, (_, i) => start + i);
    const pages = await sub.copyPages(src, indices);
    pages.forEach((p) => sub.addPage(p));
    segments.push(await sub.save());
    if (segments.length >= MAX_SEGMENTS) break;
  }
  return segments;
}

async function callAI(LOVABLE_API_KEY: string, messages: any[], log: any) {
  const model = aiModel('google/gemini-2.5-flash', aiEndpoint().provider);
  const t0 = Date.now();
  const response = await fetch(aiEndpoint().url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${aiEndpoint().key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
  log('info', 'ai.response', { status: response.status, ok: response.ok, duration_ms: Date.now() - t0 });
  if (!response.ok) {
    const errorText = await response.text();
    log('error', 'ai.error', { status: response.status, body: errorText.slice(0, 500) });
    return { ok: false, status: response.status, error: errorText };
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return { ok: true, content, usage: data.usage };
}

function parseQuiz(content: string): { questions?: any[]; title?: string } | null {
  try {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    return parsed.quiz || null;
  } catch {
    return null;
  }
}

// ---------- Main handler ----------

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const reqId = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8);
  const t0 = Date.now();
  const log = (level: 'info' | 'warn' | 'error', step: string, data: Record<string, unknown> = {}) => {
    const line = JSON.stringify({ reqId, fn: 'generate-quiz', step, level, elapsed_ms: Date.now() - t0, ...data });
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };

  log('info', 'request.start', { method: req.method });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized', reqId }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', reqId }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    log('info', 'auth.ok', { userId: user.id });

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.', reqId }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { imageBase64, extractedText, noteId, subjectId } = await req.json();
    log('info', 'request.parsed', {
      noteId, subjectId,
      hasExtractedText: !!extractedText,
      extractedTextLen: extractedText?.length ?? 0,
      hasImageBase64: !!imageBase64,
      imageBase64Kind: imageBase64?.startsWith?.('data:') ? 'data-url' : imageBase64?.startsWith?.('http') ? 'http-url' : imageBase64 ? 'base64' : 'none',
    });

    if (!imageBase64 && !extractedText) {
      return new Response(JSON.stringify({ error: 'Image or extracted text is required', reqId }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = (Deno.env.get('GEMINI_API_KEY') || Deno.env.get('LOVABLE_API_KEY'));
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured', reqId }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `Tu es un professeur expert en création de QCM pédagogiques. À partir du contenu fourni, tu dois créer un quiz de 5 questions à choix multiples.

RÈGLE DE LANGUE CRITIQUE :
Détecte automatiquement la langue du document/contenu source.
Réponds TOUJOURS dans la même langue que le contenu du document.

Retourne UNIQUEMENT un JSON valide avec cette structure exacte:
{
  "quiz": {
    "title": "Titre du quiz basé sur le sujet",
    "questions": [
      { "id": 1, "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }
    ]
  }
}

Règles:
- Exactement 5 questions
- Chaque question a exactement 4 options
- Options plausibles
- "correctIndex" est l'index (0-3)
- Si le contenu est illisible, retourne {"quiz": null, "error": "Contenu non reconnu"}`;

    // ---------- Build payload(s) ----------
    type Payload =
      | { kind: 'text'; text: string }
      | { kind: 'inline'; mime: string; b64: string; label?: string };

    const payloads: Payload[] = [];
    // Debug metadata accumulator
    const segmentsMeta: any[] = [];
    let sourceKind: string = 'none';
    let sourceMime: string | null = null;
    let originalBytes: number | null = null;

    if (extractedText && extractedText.length > 50) {
      log('info', 'content.mode', { mode: 'text', length: extractedText.length });
      payloads.push({ kind: 'text', text: extractedText });
      sourceKind = 'text';
      originalBytes = extractedText.length;
      segmentsMeta.push({ idx: 0, kind: 'text', length: extractedText.length });
    } else if (imageBase64) {
      // 1. Normalize source -> raw bytes + mime
      let bytes: Uint8Array;
      let mime = 'image/jpeg';

      if (imageBase64.startsWith('data:')) {
        const m = imageBase64.match(/^data:([^;]+);base64,(.*)$/);
        if (!m) {
          return new Response(JSON.stringify({ error: 'Invalid data URL', reqId }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        mime = m[1];
        bytes = b64ToBytes(m[2]);
        sourceKind = 'data-url';
      } else if (imageBase64.startsWith('http')) {
        log('info', 'fetch.start', { url: imageBase64.slice(0, 120) });
        const fetchT0 = Date.now();
        const fileRes = await fetch(imageBase64);
        if (!fileRes.ok) {
          log('error', 'fetch.failed', { status: fileRes.status });
          return new Response(JSON.stringify({ error: 'Impossible de récupérer le document.', reqId }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const headerCt = fileRes.headers.get('content-type');
        mime = headerCt || (imageBase64.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg');
        bytes = new Uint8Array(await fileRes.arrayBuffer());
        sourceKind = 'http-url';
        log('info', 'fetch.response', { status: fileRes.status, mime, bytes: bytes.length, duration_ms: Date.now() - fetchT0 });
      } else {
        bytes = b64ToBytes(imageBase64);
        sourceKind = 'base64';
      }
      sourceMime = mime;
      originalBytes = bytes.byteLength;

      if (bytes.byteLength > HARD_MAX_BYTES * 3) {
        return new Response(JSON.stringify({ error: `Document beaucoup trop volumineux (${(bytes.byteLength/1024/1024).toFixed(1)} Mo).`, reqId }), { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 2. Compress (image) OR split (PDF)
      if (mime === 'application/pdf') {
        try {
          const segs = await splitPdf(bytes);
          log('info', 'pdf.split', { totalSegments: segs.length, originalBytes: bytes.length });
          for (let i = 0; i < segs.length; i++) {
            const seg = segs[i];
            if (seg.byteLength > HARD_MAX_BYTES) {
              log('warn', 'pdf.segment.too_large', { idx: i, bytes: seg.byteLength });
              segmentsMeta.push({ idx: i, kind: 'pdf', label: `partie ${i + 1}/${segs.length}`, bytes: seg.byteLength, skipped: 'too_large' });
              continue;
            }
            payloads.push({ kind: 'inline', mime: 'application/pdf', b64: bytesToB64(seg), label: `partie ${i + 1}/${segs.length}` });
            segmentsMeta.push({ idx: i, kind: 'pdf', label: `partie ${i + 1}/${segs.length}`, bytes: seg.byteLength, mime: 'application/pdf' });
          }
        } catch (e) {
          log('error', 'pdf.split.failed', { error: e instanceof Error ? e.message : String(e) });
          if (bytes.byteLength <= HARD_MAX_BYTES) {
            payloads.push({ kind: 'inline', mime, b64: bytesToB64(bytes) });
            segmentsMeta.push({ idx: 0, kind: 'pdf', bytes: bytes.byteLength, mime, splitFailed: true });
          } else {
            return new Response(JSON.stringify({ error: 'PDF illisible ou trop volumineux.', reqId }), { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      } else if (mime.startsWith('image/')) {
        try {
          const compressed = bytes.byteLength > TARGET_BYTES
            ? await compressImage(bytes)
            : { bytes, mime, width: 0, height: 0, quality: 100 };
          log('info', 'image.compressed', {
            originalBytes: bytes.length,
            compressedBytes: compressed.bytes.length,
            mime: compressed.mime,
            width: compressed.width,
            height: compressed.height,
            quality: compressed.quality,
          });
          payloads.push({ kind: 'inline', mime: compressed.mime, b64: bytesToB64(compressed.bytes) });
          segmentsMeta.push({
            idx: 0, kind: 'image', mime: compressed.mime,
            originalBytes: bytes.byteLength, compressedBytes: compressed.bytes.byteLength,
            width: compressed.width, height: compressed.height, quality: compressed.quality,
          });
        } catch (e) {
          log('error', 'image.compress.failed', { error: e instanceof Error ? e.message : String(e) });
          payloads.push({ kind: 'inline', mime, b64: bytesToB64(bytes) });
          segmentsMeta.push({ idx: 0, kind: 'image', mime, bytes: bytes.byteLength, compressionFailed: true });
        }
      } else {
        payloads.push({ kind: 'inline', mime, b64: bytesToB64(bytes) });
        segmentsMeta.push({ idx: 0, kind: 'unknown', mime, bytes: bytes.byteLength });
      }
    } else {
      return new Response(JSON.stringify({ error: 'No valid content provided', reqId }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    log('info', 'payloads.ready', { count: payloads.length });

    // ---------- Generate per-segment quizzes ----------
    // Track each candidate question's source segment for debug
    const allQuestions: any[] = [];
    let titleHint = '';

    for (let i = 0; i < payloads.length; i++) {
      const p = payloads[i];
      const userContent: any =
        p.kind === 'text'
          ? `Génère un QCM de 5 questions basé sur ce contenu de cours:\n\n${p.text}`
          : [
              { type: 'text', text: `Analyse ce document de cours${p.label ? ' (' + p.label + ')' : ''} et génère un QCM de 5 questions.` },
              { type: 'image_url', image_url: { url: `data:${p.mime};base64,${p.b64}` } },
            ];

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ];

      log('info', 'ai.request', { segment: i + 1, of: payloads.length, kind: p.kind });
      const aiT0 = Date.now();
      const res = await callAI(LOVABLE_API_KEY, messages, log);
      const segMetaEntry = segmentsMeta.find((s) => s.idx === i) || segmentsMeta[i];
      if (segMetaEntry) {
        segMetaEntry.ai_duration_ms = Date.now() - aiT0;
        segMetaEntry.ai_ok = res.ok;
      }
      if (!res.ok) {
        if (segMetaEntry) segMetaEntry.ai_status = res.status;
        if (res.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.', reqId }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (res.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.', reqId }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        continue;
      }
      const quiz = parseQuiz(res.content);
      if (quiz?.questions?.length) {
        if (!titleHint && quiz.title) titleHint = quiz.title;
        // Tag each candidate with its source segment idx
        for (const q of quiz.questions) {
          allQuestions.push({ ...q, _src: i, _srcLabel: p.kind === 'text' ? 'text' : (p.label || `segment ${i + 1}`) });
        }
        if (segMetaEntry) segMetaEntry.questions_returned = quiz.questions.length;
        log('info', 'segment.parsed', { segment: i + 1, questions: quiz.questions.length });
      } else {
        if (segMetaEntry) segMetaEntry.questions_returned = 0;
        log('warn', 'segment.empty', { segment: i + 1 });
      }
    }

    if (allQuestions.length === 0) {
      // Persist debug even on failure
      try {
        await supabaseClient.from('quiz_debug_runs').insert({
          user_id: user.id, req_id: reqId, note_id: noteId ?? null, subject_id: subjectId ?? null,
          source_kind: sourceKind, source_mime: sourceMime, original_bytes: originalBytes,
          segments_count: payloads.length, segments: segmentsMeta,
          candidate_questions_count: 0, merge_used: false, final_questions: [],
          total_duration_ms: Date.now() - t0, error: 'no_questions_generated',
        });
      } catch (e) { log('warn', 'debug.persist.failed', { error: e instanceof Error ? e.message : String(e) }); }
      return new Response(JSON.stringify({ error: 'No quiz generated', quiz: null, reqId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---------- Merge to final 5 questions ----------
    let finalQuiz: { title: string; questions: any[] };
    let mergeUsed = false;
    const finalWithSource: any[] = [];

    if (payloads.length === 1 || allQuestions.length <= 5) {
      const picked = allQuestions.slice(0, 5);
      finalQuiz = {
        title: titleHint || 'Quiz',
        questions: picked.map((q, idx) => {
          const { _src, _srcLabel, ...rest } = q;
          return { ...rest, id: idx + 1 };
        }),
      };
      picked.forEach((q, idx) => finalWithSource.push({
        id: idx + 1, question: q.question, source_segment_idx: q._src, source_label: q._srcLabel,
      }));
      log('info', 'merge.shortcut', { kept: finalQuiz.questions.length });
    } else {
      mergeUsed = true;
      // Include _src so model can echo it back
      const candidatesForMerge = allQuestions.map((q, idx) => ({ _cid: idx, _src: q._src, ...q }));
      const mergePrompt = `Voici plusieurs QCM générés à partir de segments d'un même document. Sélectionne et reformule les 5 MEILLEURES questions couvrant les thèmes clés (variées, non redondantes). Garde la langue d'origine. Pour chaque question retenue, conserve son champ "_src" indiquant le segment source.

Questions candidates (JSON):
${JSON.stringify(candidatesForMerge).slice(0, 12000)}

Retourne UNIQUEMENT le JSON final:
{"quiz":{"title":"...","questions":[{"id":1,"_src":0,"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}}`;

      log('info', 'merge.request', { candidates: allQuestions.length });
      const merged = await callAI(LOVABLE_API_KEY, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: mergePrompt },
      ], log);

      const mergedQuiz = merged.ok ? parseQuiz(merged.content) : null;
      if (mergedQuiz?.questions?.length) {
        const picked = mergedQuiz.questions.slice(0, 5);
        finalQuiz = {
          title: mergedQuiz.title || titleHint || 'Quiz',
          questions: picked.map((q: any, idx: number) => {
            const { _src, _cid, _srcLabel, ...rest } = q;
            return { ...rest, id: idx + 1 };
          }),
        };
        picked.forEach((q: any, idx: number) => {
          const src = typeof q._src === 'number'
            ? q._src
            : (allQuestions.find((c) => c.question === q.question)?._src ?? null);
          finalWithSource.push({
            id: idx + 1, question: q.question, source_segment_idx: src,
            source_label: src != null ? (segmentsMeta[src]?.label || `segment ${src + 1}`) : null,
          });
        });
      } else {
        log('warn', 'merge.failed.fallback');
        const picked = allQuestions.slice(0, 5);
        finalQuiz = {
          title: titleHint || 'Quiz',
          questions: picked.map((q, idx) => {
            const { _src, _srcLabel, ...rest } = q;
            return { ...rest, id: idx + 1 };
          }),
        };
        picked.forEach((q, idx) => finalWithSource.push({
          id: idx + 1, question: q.question, source_segment_idx: q._src, source_label: q._srcLabel,
        }));
      }
    }

    // ---------- Persist debug run ----------
    try {
      await supabaseClient.from('quiz_debug_runs').insert({
        user_id: user.id,
        req_id: reqId,
        note_id: noteId ?? null,
        subject_id: subjectId ?? null,
        source_kind: sourceKind,
        source_mime: sourceMime,
        original_bytes: originalBytes,
        segments_count: payloads.length,
        segments: segmentsMeta,
        candidate_questions_count: allQuestions.length,
        merge_used: mergeUsed,
        final_questions: finalWithSource,
        total_duration_ms: Date.now() - t0,
      });
      log('info', 'debug.persisted', { segments: segmentsMeta.length, finals: finalWithSource.length });
    } catch (e) {
      log('warn', 'debug.persist.failed', { error: e instanceof Error ? e.message : String(e) });
    }

    log('info', 'request.success', { questions: finalQuiz.questions.length, segments: payloads.length });
    return new Response(JSON.stringify({ quiz: finalQuiz, noteId, subjectId, reqId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });


  } catch (error) {
    log('error', 'request.unhandled', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.slice(0, 500) : undefined,
    });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', reqId }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
