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

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64, extractedText, noteId, subjectId } = await req.json();

    if (!imageBase64 && !extractedText) {
      return new Response(
        JSON.stringify({ error: 'Image or extracted text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating QCM from content...');
    console.log('Has extractedText:', !!extractedText);
    console.log('Has imageBase64:', !!imageBase64);

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
      console.log('Using text mode with extracted content');
      messages.push({
        role: 'user',
        content: `Génère un QCM de 5 questions basé sur ce contenu de cours:\n\n${extractedText}`
      });
    } else if (isValidBase64) {
      // Use base64 image if it's valid
      console.log('Using image mode with base64');
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
      console.log('Fetching remote file to inline as data URL');
      try {
        const fileRes = await fetch(imageBase64);
        if (!fileRes.ok) throw new Error(`fetch ${fileRes.status}`);
        const contentType = fileRes.headers.get('content-type') ||
          (imageBase64.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg');
        const buf = new Uint8Array(await fileRes.arrayBuffer());
        // base64 encode
        let binary = '';
        for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
        const b64 = btoa(binary);
        const dataUrl = `data:${contentType};base64,${b64}`;
        console.log('Inlined file as', contentType, 'size:', buf.length);
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: 'Analyse ce document de cours et génère un QCM de 5 questions.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        });
      } catch (e) {
        console.error('Failed to inline remote file:', e);
        return new Response(
          JSON.stringify({ error: 'Impossible de récupérer le document. Réessaie après extraction OCR.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } else {
      // Fallback to text if nothing valid
      console.log('Fallback: no valid content');
      return new Response(
        JSON.stringify({ error: 'No valid content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate quiz' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content);

    // Parse the JSON response
    let quiz = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        quiz = parsed.quiz || null;
      }
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', quiz: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!quiz) {
      return new Response(
        JSON.stringify({ error: 'No quiz generated', quiz: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generated quiz with ${quiz.questions?.length || 0} questions`);

    return new Response(
      JSON.stringify({ 
        quiz,
        noteId,
        subjectId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quiz:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
