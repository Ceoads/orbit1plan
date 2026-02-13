import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
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
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { imageBase64, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'ocr') {
      systemPrompt = `Tu es un assistant OCR et d'analyse de notes scientifiques pour étudiants en STAPS, médecine, ingénierie et sciences. Extrais tout le texte visible de l'image et fournis un résumé structuré.

Tu dois générer tout le contenu en Français, sauf si le document source est un cours d'Anglais ou si le contenu est explicitement en anglais.

CRITIQUE : Pour toute expression mathématique, physique ou chimique :
- Encadre les variables/symboles en ligne avec un seul $ : $\\alpha$, $x^2$, $\\Delta T$
- Encadre les équations complexes avec $$ : $$f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)e^{2\\pi i \\xi x} \\,d\\xi$$

Formate ta réponse en JSON avec deux champs :
- "rawText" : Le texte complet extrait avec formatage LaTeX pour toute notation math/science
- "aiSummary" : 3-5 points clés mettant en avant les concepts essentiels (utilise LaTeX pour les formules). Chaque point doit être sur sa propre ligne commençant par "• "

Exemples de formatage LaTeX :
- Variables : $\\alpha$, $\\beta$, $\\theta$
- Fractions : $\\frac{a}{b}$
- Intégrales : $\\int_a^b f(x)dx$
- Sommes : $\\sum_{i=1}^n x_i$
- Lettres grecques : $\\Delta$, $\\Sigma$, $\\Omega$

Sois concis et concentre-toi sur les informations utiles pour l'étude.`;
      userPrompt = 'Analyse cette image, extrais le texte avec un formatage LaTeX approprié pour toute notation mathématique ou scientifique, et résume les points clés pour l\'étude.';
    } else if (action === 'decompose') {
      systemPrompt = `Tu es un assistant de décomposition de tâches aidant les étudiants avec des difficultés de fonctions exécutives. Décompose les grandes tâches en 3 sous-tâches plus petites et actionnables. Formate ta réponse en JSON avec un tableau "subtasks" contenant des objets avec :
- "title" : Un titre de tâche clair et actionnable
- "energyLevel" : Soit "low", "medium", ou "high" selon l'effort cognitif requis

Rends les tâches spécifiques, réalisables et progressives. Génère tout en français.`;
      userPrompt = imageBase64; // In decompose mode, this is the task title
    } else {
      throw new Error('Invalid action specified');
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (action === 'ocr' && imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { 
            type: 'image_url', 
            image_url: { 
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` 
            } 
          }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    console.log('Calling Lovable AI Gateway with action:', action);

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
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI response received:', content?.substring(0, 200));

    // Try to parse as JSON
    let result;
    try {
      // Clean up markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch {
      // If not valid JSON, return as plain text
      result = { rawText: content, aiSummary: 'Unable to parse structured response' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in process-note function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
