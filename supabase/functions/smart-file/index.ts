import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting: max 10 requests per minute per user
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

interface SubjectMatch {
  id: string;
  name: string;
  ical_code: string | null;
  icon: string;
  confidence: number;
}

interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  isOnCampus: boolean | null;
  distanceFromCampus: number | null;
}

interface ClassHistoryData {
  mode: 'campus' | 'home' | 'unknown';
  isOnCampus: boolean | null;
  distanceFromCampus: number | null;
  campusName: string | null;
  mostRecentClass: {
    title: string;
    subject_id: string | null;
    endTime: string;
  } | null;
  todayClassHistory: {
    title: string;
    subject_id: string | null;
    time: string;
  }[];
}

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
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const user = { id: claimsData.claims.sub as string };

    const { 
      imageBase64, 
      userId,
      currentClassId,
      todayClasses,
      subjects,
      geolocation,
      contextMode,
      classHistory,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const geo = geolocation as GeolocationData | undefined;
    const history = classHistory as ClassHistoryData | undefined;

    // Build subject list for AI context
    const subjectList = subjects?.map((s: any) => 
      `- ${s.name} (keywords: ${s.ical_code || s.name})`
    ).join('\n') || 'No subjects configured';

    // Build location context
    let locationContext = '';
    if (geo?.isOnCampus === true) {
      locationContext = `📍 LOCATION: User is ON CAMPUS (${history?.campusName || 'school'}). This strongly suggests the document is related to current or recent classes.`;
    } else if (geo?.isOnCampus === false && geo.distanceFromCampus) {
      locationContext = `🏠 LOCATION: User is at HOME (${Math.round(geo.distanceFromCampus)}m from campus). 
This is "WORK FROM HOME" mode - analyze the document content carefully and consider today's class history.`;
    } else {
      locationContext = 'LOCATION: Unknown - rely on document content analysis.';
    }

    // Build current class context
    let currentClassInfo = '';
    if (currentClassId && todayClasses) {
      const currentClass = todayClasses.find((c: any) => c.id === currentClassId);
      if (currentClass) {
        currentClassInfo = `🎓 CURRENT CLASS: "${currentClass.title}" (${currentClass.start_time}-${currentClass.end_time}). 
If the user is on campus and in this class, strongly weight this subject.`;
      }
    }

    // Build work-from-home context
    let workFromHomeContext = '';
    if (contextMode === 'home' && history && history.todayClassHistory && history.todayClassHistory.length > 0) {
      const recentClasses = history.todayClassHistory
        .map(c => `• ${c.title} (${c.time})`)
        .join('\n');
      
      const mostRecentTitle = history.mostRecentClass?.title || 'Unknown';
      const mostRecentEndTime = history.mostRecentClass?.endTime || 'unknown';
      
      workFromHomeContext = `
📚 WORK FROM HOME MODE - Today's completed classes:
${recentClasses}

Most recent class: "${mostRecentTitle}" (ended at ${mostRecentEndTime})

STRATEGY: Since the user is studying at home, they are likely:
1. Reviewing notes from a class they had today
2. Doing homework for a class they had today
3. Preparing for tomorrow's classes

Analyze the document content and match it to the most likely class from today's history.
If the content clearly matches a recent class, suggest that subject with high confidence.`;
    }

    const todayClassesInfo = todayClasses?.length > 0
      ? `Today's schedule: ${todayClasses.map((c: any) => `${c.title} (${c.start_time}-${c.end_time})`).join(', ')}`
      : 'No classes scheduled today';

    const systemPrompt = `Tu es un assistant intelligent de classement de documents pour étudiants. Ton travail :
1. Extraire TOUT le texte de l'image via OCR
2. Analyser le contenu pour déterminer la matière/le cours correspondant
3. Utiliser le contexte de localisation et d'emploi du temps pour améliorer la précision
4. Fournir un score de confiance pour ta détection de matière

RÈGLE DE LANGUE CRITIQUE :
Détecte automatiquement la langue du document source.
Réponds TOUJOURS dans la même langue que le contenu du document pour les champs rawText, aiSummary et tags.
- Document en français → rawText/aiSummary/tags en français
- Document en anglais → rawText/aiSummary/tags en anglais
- Document mixte → Utilise la langue dominante
Le champ reasoning peut rester dans la langue du document.

Available subjects:
${subjectList}

${locationContext}

${currentClassInfo}

${workFromHomeContext}

${todayClassesInfo}

CLASSIFICATION RULES:
1. ON CAMPUS + IN CLASS: Weight current class subject very high (0.85-0.95)
2. ON CAMPUS + BETWEEN CLASSES: Analyze content, consider recent/upcoming classes
3. WORK FROM HOME: Match content to today's class history, weight recent classes higher
4. UNKNOWN LOCATION: Pure content analysis

Look for:
- Course titles, chapter names, textbook references
- Professor names or initials
- Mathematical formulas (→ Math/Physics)
- Historical dates, events (→ History)
- Chemical formulas, reactions (→ Chemistry)
- Literary quotes, analysis (→ English/Literature)
- Code, algorithms (→ Computer Science)
- Legal terms (→ Law)
- Economic graphs, terms (→ Economics)

IMPORTANT : Les champs textuels (rawText, aiSummary, tags) doivent être dans la MÊME LANGUE que le document source.

Réponds avec du JSON uniquement :
{
  "rawText": "Texte complet extrait de l'image",
  "aiSummary": "Un bref résumé en 1-2 phrases des concepts clés, DANS LA LANGUE DU DOCUMENT",
  "detectedSubject": {
    "name": "Most likely subject name",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation including location/schedule context used"
  },
  "alternativeSubjects": [
    {"name": "Second choice", "confidence": 0.0-1.0}
  ],
  "detectedKeywords": ["keyword1", "keyword2"],
  "suggestedTags": ["tag1", "tag2"],
  "locationUsed": true/false,
  "classHistoryUsed": true/false
}`;

    const userPrompt = 'Analyse cette image de document. Extrais tout le texte, détermine la matière en utilisant tout le contexte disponible (localisation, emploi du temps, contenu), et fournis les métadonnées structurées. Réponds dans la même langue que le document source.';

    console.log('Calling AI for smart filing with geolocation context:', {
      contextMode,
      isOnCampus: geo?.isOnCampus,
      hasClassHistory: history?.todayClassHistory?.length || 0,
    });

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
    let result: any;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch {
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
      
      let bestMatch: SubjectMatch | null = null;
      let bestScore = 0;

      for (const subject of subjects) {
        const subjectName = subject.name.toLowerCase();
        const icalCode = (subject.ical_code || '').toLowerCase();
        
        // Exact match
        if (subjectName === detectedName || icalCode === detectedName) {
          bestMatch = { ...subject, confidence: result.detectedSubject.confidence };
          break;
        }
        
        // Partial match
        if (subjectName.includes(detectedName) || detectedName.includes(subjectName)) {
          const score = Math.min(subjectName.length, detectedName.length) / Math.max(subjectName.length, detectedName.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { ...subject, confidence: result.detectedSubject.confidence * score };
          }
        }
        
        // iCal code match
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

    // Context boost for on-campus users in a class
    if (currentClassId && todayClasses && geo?.isOnCampus === true && (!result.matchedSubjectId || result.matchConfidence < 0.8)) {
      const currentClass = todayClasses.find((c: any) => c.id === currentClassId);
      if (currentClass?.subject_id) {
        const currentSubject = subjects?.find((s: any) => s.id === currentClass.subject_id);
        if (currentSubject) {
          result.contextBoost = {
            reason: 'User is on campus and currently in this class',
            boostedSubjectId: currentSubject.id,
            boostedSubjectName: currentSubject.name,
            boostedSubjectIcon: currentSubject.icon,
            originalConfidence: result.matchConfidence || 0,
            boostedConfidence: Math.min((result.matchConfidence || 0.6) + 0.25, 0.95)
          };
        }
      }
    }

    // Work from home fallback - suggest most recent class if AI is uncertain
    if (contextMode === 'home' && history?.mostRecentClass && (!result.matchedSubjectId || result.matchConfidence < 0.6)) {
      const recentSubject = subjects?.find((s: any) => s.id === history.mostRecentClass?.subject_id);
      if (recentSubject) {
        result.workFromHomeSuggestion = {
          reason: `You had "${history.mostRecentClass.title}" at ${history.mostRecentClass.endTime} today. Is this related?`,
          subjectId: recentSubject.id,
          subjectName: recentSubject.name,
          subjectIcon: recentSubject.icon,
          confidence: 0.65,
        };
        result.workFromHomeReasoning = `Tu as eu ${recentSubject.name} à ${history.mostRecentClass.endTime} aujourd'hui. Est-ce pour ce cours ?`;
      }
    }

    // Add context metadata to result
    const hasClassHistory = !!(history && history.todayClassHistory && history.todayClassHistory.length > 0);
    result.contextInfo = {
      mode: contextMode,
      wasOnCampus: geo?.isOnCampus,
      distanceFromCampus: geo?.distanceFromCampus,
      locationUsedForSuggestion: result.locationUsed || geo?.isOnCampus !== null,
      classHistoryUsed: result.classHistoryUsed || (contextMode === 'home' && hasClassHistory),
    };

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
