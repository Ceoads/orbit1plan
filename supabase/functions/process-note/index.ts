import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'ocr') {
      systemPrompt = `You are an OCR and scientific note analysis assistant for students in STAPS, medicine, engineering, and sciences. Extract all visible text from the image and provide a structured summary.

CRITICAL: For any mathematical, physical, or chemical expressions:
- Wrap inline variables/symbols with single $: $\\alpha$, $x^2$, $\\Delta T$
- Wrap complex equations with $$: $$f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)e^{2\\pi i \\xi x} \\,d\\xi$$

Format your response as JSON with two fields:
- "rawText": The complete extracted text with LaTeX formatting for any math/science notation
- "aiSummary": 3-5 bullet points highlighting key concepts (use LaTeX for formulas). Each point should be on its own line starting with "• "

Examples of LaTeX formatting:
- Variables: $\\alpha$, $\\beta$, $\\theta$
- Fractions: $\\frac{a}{b}$
- Integrals: $\\int_a^b f(x)dx$
- Sums: $\\sum_{i=1}^n x_i$
- Greek letters: $\\Delta$, $\\Sigma$, $\\Omega$

Be concise and focus on information useful for studying.`;
      userPrompt = 'Please analyze this image, extract the text with proper LaTeX formatting for any mathematical or scientific notation, and summarize the key points for studying.';
    } else if (action === 'decompose') {
      systemPrompt = `You are a task decomposition assistant helping students with executive dysfunction. Break down large tasks into 3 smaller, actionable sub-tasks. Format your response as JSON with a "subtasks" array containing objects with:
- "title": A clear, actionable task title
- "energyLevel": Either "low", "medium", or "high" based on cognitive effort required

Make tasks specific, achievable, and progressive.`;
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
