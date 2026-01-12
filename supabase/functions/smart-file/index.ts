import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubjectMatch {
  id: string;
  name: string;
  ical_code: string | null;
  icon: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      imageBase64, 
      userId,
      currentClassId,
      todayClasses,
      subjects 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build subject list for AI context
    const subjectList = subjects.map((s: any) => 
      `- ${s.name} (keywords: ${s.ical_code || s.name})`
    ).join('\n');

    const currentClassInfo = currentClassId 
      ? `The user is currently in class: ${todayClasses?.find((c: any) => c.id === currentClassId)?.title || 'Unknown'}`
      : 'The user is not currently in any class';

    const todayClassesInfo = todayClasses?.length > 0
      ? `Today's classes: ${todayClasses.map((c: any) => `${c.title} (${c.start_time}-${c.end_time})`).join(', ')}`
      : 'No classes scheduled today';

    const systemPrompt = `You are an intelligent document filing assistant for students. Your job is to:
1. Extract ALL text from the image using OCR
2. Analyze the content to determine which subject/course it belongs to
3. Provide a confidence score for your subject detection

Available subjects:
${subjectList}

Context information:
${currentClassInfo}
${todayClassesInfo}

IMPORTANT RULES:
- If the user is currently in a class, weight that subject higher (but still analyze content)
- Look for keywords, formulas, diagrams, course titles, or professor names
- Consider the language and terminology used (technical, literary, scientific, etc.)
- If you detect multiple subjects, choose the most likely one
- Be honest about your confidence level

Respond with JSON only:
{
  "rawText": "Complete extracted text from the image",
  "aiSummary": "A brief 1-2 sentence summary of the key concepts",
  "detectedSubject": {
    "name": "Most likely subject name",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of why you chose this subject"
  },
  "alternativeSubjects": [
    {"name": "Second choice", "confidence": 0.0-1.0}
  ],
  "detectedKeywords": ["keyword1", "keyword2"],
  "suggestedTags": ["tag1", "tag2"]
}`;

    const userPrompt = 'Analyze this document image. Extract all text, determine the subject, and provide structured metadata.';

    console.log('Calling AI for smart filing analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
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
          }
        ],
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

    console.log('AI response received');

    // Parse the response
    let result;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch {
      // Fallback if parsing fails
      result = {
        rawText: content,
        aiSummary: 'Unable to parse structured response',
        detectedSubject: null,
        alternativeSubjects: [],
        detectedKeywords: [],
        suggestedTags: []
      };
    }

    // Try to match detected subject to actual subject IDs
    if (result.detectedSubject?.name && subjects?.length > 0) {
      const detectedName = result.detectedSubject.name.toLowerCase();
      
      // Find best matching subject
      let bestMatch: SubjectMatch | null = null;
      let bestScore = 0;

      for (const subject of subjects) {
        const subjectName = subject.name.toLowerCase();
        const icalCode = (subject.ical_code || '').toLowerCase();
        
        // Check for exact match
        if (subjectName === detectedName || icalCode === detectedName) {
          bestMatch = { ...subject, confidence: result.detectedSubject.confidence };
          break;
        }
        
        // Check for partial match
        if (subjectName.includes(detectedName) || detectedName.includes(subjectName)) {
          const score = Math.min(subjectName.length, detectedName.length) / Math.max(subjectName.length, detectedName.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { ...subject, confidence: result.detectedSubject.confidence * score };
          }
        }
        
        // Check ical_code match
        if (icalCode && (icalCode.includes(detectedName) || detectedName.includes(icalCode))) {
          const score = 0.9;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { ...subject, confidence: result.detectedSubject.confidence * score };
          }
        }
      }

      if (bestMatch) {
        result.matchedSubjectId = bestMatch.id;
        result.matchedSubjectName = bestMatch.name;
        result.matchedSubjectIcon = bestMatch.icon;
        result.matchConfidence = bestMatch.confidence;
      }
    }

    // If currently in a class and AI is uncertain, boost that class's subject
    if (currentClassId && todayClasses && (!result.matchedSubjectId || result.matchConfidence < 0.7)) {
      const currentClass = todayClasses.find((c: any) => c.id === currentClassId);
      if (currentClass?.subject_id) {
        const currentSubject = subjects.find((s: any) => s.id === currentClass.subject_id);
        if (currentSubject) {
          result.contextBoost = {
            reason: 'User is currently in this class',
            boostedSubjectId: currentSubject.id,
            boostedSubjectName: currentSubject.name,
            boostedSubjectIcon: currentSubject.icon,
            originalConfidence: result.matchConfidence || 0,
            boostedConfidence: Math.min((result.matchConfidence || 0.5) + 0.3, 0.95)
          };
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in smart-file function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
