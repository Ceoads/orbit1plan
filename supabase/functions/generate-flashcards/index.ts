import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Visual/spatial concepts that benefit from illustrations
const VISUAL_SUBJECT_KEYWORDS = [
  // Biology & Anatomy
  'anatomie', 'anatomy', 'muscle', 'os', 'organe', 'organ', 'cellule', 'cell',
  'mitose', 'meiose', 'adn', 'dna', 'chromosome', 'neurone', 'synapse',
  'coeur', 'heart', 'poumon', 'lung', 'cerveau', 'brain', 'squelette', 'skeleton',
  'tissu', 'tissue', 'artère', 'veine', 'sang', 'blood', 'système nerveux',
  'système digestif', 'système respiratoire', 'appareil',
  
  // SVT / Life Sciences
  'svt', 'biologie', 'biology', 'écosystème', 'ecosystem', 'photosynthèse',
  'chaîne alimentaire', 'food chain', 'cycle', 'plante', 'plant', 'fleur', 'flower',
  'racine', 'root', 'feuille', 'leaf', 'reproduction', 'évolution',
  
  // Geography & Earth Sciences
  'géographie', 'geography', 'carte', 'map', 'continent', 'océan', 'ocean',
  'relief', 'montagne', 'mountain', 'volcan', 'volcano', 'tectonique', 'tectonic',
  'climat', 'climate', 'fleuve', 'river', 'delta', 'littoral', 'frontière',
  
  // Physics & Chemistry
  'physique', 'physics', 'chimie', 'chemistry', 'atome', 'atom', 'molécule', 'molecule',
  'circuit', 'électrique', 'electric', 'magnétique', 'magnetic', 'onde', 'wave',
  'spectre', 'spectrum', 'réaction', 'reaction', 'liaison', 'bond',
  
  // Math & Geometry
  'géométrie', 'geometry', 'triangle', 'cercle', 'circle', 'polygone', 'polygon',
  'angle', 'parallèle', 'perpendiculaire', 'symétrie', 'symmetry', 'vecteur', 'vector',
  'fonction', 'graphique', 'graph', 'courbe', 'curve',
  
  // Art History
  'architecture', 'sculpture', 'peinture', 'painting', 'style', 'mouvement artistique',
  'perspective', 'composition', 'gothique', 'baroque', 'renaissance'
];

// Check if a concept is visual and would benefit from an illustration
function isVisualConcept(question: string, answer: string): boolean {
  const combined = `${question} ${answer}`.toLowerCase();
  return VISUAL_SUBJECT_KEYWORDS.some(keyword => combined.includes(keyword.toLowerCase()));
}

// Generate an optimized image prompt for educational diagrams
function generateImagePrompt(question: string, answer: string): string {
  const concept = answer.length > question.length ? answer : question;
  
  return `Educational scientific diagram illustration of: ${concept}.
Style: Clean vector illustration, medical/technical diagram style. NOT photorealistic.
Design: Clear lines, labeled parts with arrows or highlights pointing to key elements.
Color palette: Soft pastel colors (peach, cream, coral accents) on white/cream background.
Important: NO TEXT on the image. Clean professional scientific illustration suitable for a premium educational app.
Focus on clarity and accuracy of the anatomical/scientific representation.`;
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

    const { imageBase64, noteContent, noteId, subjectId, generateImages = true } = await req.json();

    // Accept either imageBase64 OR noteContent (extracted text)
    if (!imageBase64 && !noteContent) {
      return new Response(
        JSON.stringify({ error: 'Image base64 or note content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const useTextMode = !imageBase64 && !!noteContent;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating flashcards from image...');

    const systemPrompt = `Tu es un assistant pédagogique expert. À partir du contenu de cours fourni, tu dois:
1. Analyser et comprendre le contenu
2. Identifier les concepts clés et informations importantes
3. Créer 5 à 10 flashcards de révision (Question/Réponse)

RÈGLE DE LANGUE CRITIQUE :
Détecte automatiquement la langue du document/contenu source.
Réponds TOUJOURS dans la même langue que le contenu du document.
- Document en français → Génère questions et réponses en français
- Document en anglais → Génère questions et réponses en anglais
- Document en espagnol → Génère questions et réponses en espagnol
- Document mixte → Utilise la langue dominante
Ne jamais répondre dans une langue différente de celle du document source.

Retourne UNIQUEMENT un JSON valide avec cette structure exacte:
{
  "flashcards": [
    {"question": "Question claire et précise", "answer": "Réponse concise et complète", "requires_image": true/false},
    ...
  ]
}

Règles:
- Questions variées: définitions, applications, comparaisons
- Réponses concises mais complètes
- Adapte le niveau au contenu (universitaire, lycée, etc.)
- IMPORTANT: Mets "requires_image": true si le concept est visuel/spatial/anatomique (ex: schéma d'organe, carte, diagramme, structure cellulaire)
- Mets "requires_image": false pour les concepts abstraits (définitions philosophiques, dates, etc.)
- Si le contenu est illisible ou ne contient pas de contenu éducatif, retourne {"flashcards": [], "error": "Contenu non reconnu"}`;

    // Build messages based on input type
    let messages: any[];
    
    if (useTextMode) {
      // Text-only mode
      console.log('Using text mode with extracted content');
      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyse ce contenu de cours et génère des flashcards de révision. Pour chaque concept visuel (anatomie, schéma, carte, etc.), indique requires_image: true.\n\nContenu:\n${noteContent}`
        }
      ];
    } else {
      // Image mode
      console.log('Using image mode');
      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyse cette image de cours et génère des flashcards de révision. Pour chaque concept visuel (anatomie, schéma, carte, etc.), indique requires_image: true.' },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ];
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
        JSON.stringify({ error: 'Failed to generate flashcards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content);

    // Parse the JSON response
    let flashcards = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        flashcards = parsed.flashcards || [];
      }
    } catch (parseError) {
      console.error('Failed to parse flashcards JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', flashcards: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generated ${flashcards.length} flashcards`);

    // Generate images for visual concepts if enabled
    if (generateImages) {
      const flashcardsWithImages = await Promise.all(
        flashcards.map(async (card: any, index: number) => {
          // Check if this concept needs an image
          const needsImage = card.requires_image || isVisualConcept(card.question, card.answer);
          
          if (!needsImage) {
            return { ...card, image_url: null, image_prompt: null };
          }
          
          console.log(`Generating image for flashcard ${index + 1}: ${card.question.substring(0, 50)}...`);
          
          try {
            const imagePrompt = generateImagePrompt(card.question, card.answer);
            
            const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-image',
                messages: [
                  { role: 'user', content: imagePrompt }
                ],
                modalities: ['image', 'text']
              }),
            });

            if (!imageResponse.ok) {
              console.error(`Image generation failed for card ${index + 1}:`, imageResponse.status);
              return { ...card, image_url: null, image_prompt: imagePrompt };
            }

            const imageData = await imageResponse.json();
            const generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            
            if (generatedImageUrl) {
              console.log(`Successfully generated image for flashcard ${index + 1}`);
              return { ...card, image_url: generatedImageUrl, image_prompt: imagePrompt };
            }
            
            return { ...card, image_url: null, image_prompt: imagePrompt };
          } catch (imageError) {
            console.error(`Error generating image for card ${index + 1}:`, imageError);
            return { ...card, image_url: null, image_prompt: null };
          }
        })
      );
      
      flashcards = flashcardsWithImages;
    }

    const visualCount = flashcards.filter((f: any) => f.image_url).length;
    console.log(`Generated ${flashcards.length} flashcards (${visualCount} with images)`);

    return new Response(
      JSON.stringify({ 
        flashcards,
        noteId,
        subjectId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-flashcards:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
