import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawSubjects } = await req.json();

    if (!rawSubjects || !Array.isArray(rawSubjects) || rawSubjects.length === 0) {
      return new Response(
        JSON.stringify({ error: "No subjects provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a smart academic subject name cleaner for French university students.

Your job: Transform raw iCal event titles into clean, human-readable subject names.

Rules:
- Remove course type prefixes: CM, TD, TP, SAE, Cours, etc.
- Remove room numbers (e.g., S204, A301, Amphi B)
- Remove group codes (e.g., TP1, TD2, G1, Grp A)
- Remove pedagogical codes and identifiers
- Transform abbreviations into full words (MKTG → Marketing, PROG → Programmation, ALGO → Algorithmique, BDD → Base de données, MATH → Mathématiques, COMPTA → Comptabilité, STATS → Statistiques, ARCHI → Architecture, RES → Réseaux, SYS → Systèmes, DEV → Développement, INFRA → Infrastructure, COM → Communication, ECO → Économie, DROIT → Droit, ANGLAIS/ANG → Anglais, PROJET → Projet)
- Detect SAE entries (contains "SAE" in original) and mark them with isSAE: true
- Deduplicate: if multiple raw names map to the same clean subject, merge them
- Return clean, professional French names
- Keep it concise: 1-3 words max per subject

Return ONLY a JSON array of objects with this structure:
[{ "cleanName": "Marketing", "isSAE": false, "originalCodes": ["CM - MKTG - S204", "TD - MKTG"] }]`;

    const userPrompt = `Clean these raw iCal subject names into human-readable French subject names:\n\n${JSON.stringify(rawSubjects, null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_cleaned_subjects",
              description: "Return the cleaned subject names",
              parameters: {
                type: "object",
                properties: {
                  subjects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        cleanName: { type: "string" },
                        isSAE: { type: "boolean" },
                        originalCodes: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["cleanName", "isSAE", "originalCodes"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["subjects"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_cleaned_subjects" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("clean-subjects error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
