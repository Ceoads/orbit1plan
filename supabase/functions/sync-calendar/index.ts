import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Exam detection keywords
const EXAM_KEYWORDS = [
  'exam', 'examen', 'test', 'ds', 'final', 'partiel', 
  'controle', 'épreuve', 'quiz', 'midterm', 'assessment'
];

// Non-course events to EXCLUDE (vacations, holidays, cancellations, etc.)
const EXCLUDED_EVENT_KEYWORDS = [
  // Cancellations (CRITICAL - must catch all variations)
  'annulation', 'annulé', 'annule', 'annuler', 'annulée', 'annulees',
  'cancelled', 'canceled', 'cancellation', 'cancel',
  'reporté', 'reporte', 'reportee', 'report de',
  'supprimé', 'supprime', 'supprimée', 'suppression',
  'cours annulé', 'seance annulee', 'séance annulée',
  
  // Vacations & Holidays
  'vacances', 'férié', 'ferie', 'fériés', 'feries', 'ferié', 'ferie',
  'holiday', 'break', 'congé', 'conge', 'repos',
  'pont', 'toussaint', 'noël', 'noel', 'pâques', 'paques',
  'armistice', 'ascension', 'pentecôte', 'pentecote',
  'fériation', 'feriation', 'jour off', 'off day',
  
  // Study days & Non-teaching
  'journée d\'études', 'journee d\'etudes', 'jour d\'étude',
  'pas de cours', 'no class', 'sans cours',
  'suspension', 'interruption', 'réunion pédagogique',
  'semaine de révision', 'revision week', 'reading week',
  'journée banalisée', 'journee banalisee',
  'rattrapage', 'session de rattrapage',
  
  // Administrative
  'inscription', 'rentrée administrative', 'rentree',
  'absence prof', 'prof absent', 'enseignant absent'
];

// Smart icon mapping based on subject keywords
const SMART_ICON_MAP: { keywords: string[]; icon: string; color: string }[] = [
  // Sciences & Math
  { keywords: ['math', 'maths', 'mathématiques', 'algèbre', 'analyse', 'statistique', 'stat', 'probabilité', 'calcul'], icon: '🔢', color: 'math' },
  { keywords: ['physique', 'physics', 'mécanique', 'optique', 'thermodynamique'], icon: '⚛️', color: 'physics' },
  { keywords: ['chimie', 'chemistry', 'biochimie', 'organique'], icon: '🧪', color: 'chemistry' },
  { keywords: ['biologie', 'biology', 'bio', 'svt', 'génétique', 'écologie'], icon: '🧬', color: 'chemistry' },
  
  // Tech & Informatique
  { keywords: ['informatique', 'info', 'programmation', 'coding', 'développement', 'dev', 'algorithmique', 'algo'], icon: '💻', color: 'physics' },
  { keywords: ['web', 'html', 'css', 'javascript', 'react', 'frontend'], icon: '🌐', color: 'physics' },
  { keywords: ['base de données', 'database', 'sql', 'bdd', 'data'], icon: '🗄️', color: 'physics' },
  { keywords: ['réseau', 'network', 'système', 'linux', 'serveur'], icon: '🔧', color: 'physics' },
  { keywords: ['cybersécurité', 'sécurité', 'security', 'crypto'], icon: '🔐', color: 'physics' },
  { keywords: ['ia', 'intelligence artificielle', 'machine learning', 'ml', 'deep learning'], icon: '🤖', color: 'physics' },
  
  // Langues
  { keywords: ['anglais', 'english', 'lv1', 'lvb', 'lva'], icon: '🇬🇧', color: 'english' },
  { keywords: ['allemand', 'german', 'deutsch'], icon: '🇩🇪', color: 'english' },
  { keywords: ['espagnol', 'spanish', 'español'], icon: '🇪🇸', color: 'english' },
  { keywords: ['français', 'french', 'littérature', 'lettre'], icon: '🇫🇷', color: 'english' },
  { keywords: ['chinois', 'mandarin', 'chinese'], icon: '🇨🇳', color: 'english' },
  { keywords: ['japonais', 'japanese'], icon: '🇯🇵', color: 'english' },
  { keywords: ['langue', 'communication', 'expression'], icon: '🗣️', color: 'english' },
  
  // Business & Management
  { keywords: ['marketing', 'market', 'publicité', 'pub', 'brand'], icon: '📈', color: 'history' },
  { keywords: ['management', 'gestion', 'organisation', 'stratégie', 'strategy'], icon: '🎯', color: 'history' },
  { keywords: ['économie', 'economy', 'éco', 'micro', 'macro', 'finance'], icon: '💰', color: 'history' },
  { keywords: ['comptabilité', 'compta', 'accounting', 'budget'], icon: '📊', color: 'history' },
  { keywords: ['droit', 'law', 'juridique', 'legal', 'contrat'], icon: '⚖️', color: 'history' },
  { keywords: ['commerce', 'vente', 'négociation', 'négo', 'sales', 'client'], icon: '🤝', color: 'history' },
  { keywords: ['ressources humaines', 'rh', 'hr', 'recrutement'], icon: '👥', color: 'history' },
  { keywords: ['entrepreneuriat', 'startup', 'business plan', 'création'], icon: '🚀', color: 'history' },
  { keywords: ['projet', 'project', 'ppp', 'portfolio', 'professionnel'], icon: '📋', color: 'history' },
  
  // Arts & Design
  { keywords: ['art', 'dessin', 'peinture', 'sculpture', 'beaux-arts'], icon: '🎨', color: 'chemistry' },
  { keywords: ['design', 'ux', 'ui', 'graphique', 'visuel'], icon: '✨', color: 'chemistry' },
  { keywords: ['musique', 'music', 'instrument', 'solfège'], icon: '🎵', color: 'chemistry' },
  { keywords: ['photo', 'photographie', 'vidéo', 'audiovisuel'], icon: '📸', color: 'chemistry' },
  { keywords: ['théâtre', 'theater', 'drama', 'scène'], icon: '🎭', color: 'chemistry' },
  
  // Sciences Humaines
  { keywords: ['histoire', 'history', 'géo', 'géographie', 'geography'], icon: '🌍', color: 'history' },
  { keywords: ['philosophie', 'philo', 'philosophy', 'éthique'], icon: '🤔', color: 'history' },
  { keywords: ['psychologie', 'psycho', 'psychology', 'cognitif'], icon: '🧠', color: 'history' },
  { keywords: ['sociologie', 'socio', 'sociology', 'social'], icon: '👁️', color: 'history' },
  { keywords: ['politique', 'sciences po', 'politique', 'institutions'], icon: '🏛️', color: 'history' },
  
  // Sport & Santé
  { keywords: ['sport', 'eps', 'éducation physique', 'gym', 'athlétisme'], icon: '⚽', color: 'math' },
  { keywords: ['santé', 'médecine', 'anatomie', 'health', 'médical'], icon: '🏥', color: 'chemistry' },
  
  // Ingénierie
  { keywords: ['électronique', 'electronic', 'circuit', 'composant'], icon: '⚡', color: 'physics' },
  { keywords: ['mécanique', 'mechanical', 'machine', 'moteur'], icon: '⚙️', color: 'physics' },
  { keywords: ['conception', 'cao', 'cad', '3d', 'modélisation'], icon: '📐', color: 'physics' },
  { keywords: ['architecture', 'bâtiment', 'construction', 'urbanisme'], icon: '🏗️', color: 'physics' },
];

// Determine smart icon and color based on subject name
function getSmartIconAndColor(subjectName: string): { icon: string; color: string } {
  const lowerName = subjectName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const mapping of SMART_ICON_MAP) {
    for (const keyword of mapping.keywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lowerName.includes(normalizedKeyword)) {
        return { icon: mapping.icon, color: mapping.color };
      }
    }
  }
  
  // Fallback: generic book icon
  return { icon: '📚', color: 'english' };
}

// Check if event should be excluded (vacations, holidays, cancellations, etc.)
function isExcludedEvent(title: string): boolean {
  const lowerTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Special check for prefix patterns (most common cancellation format)
  const prefixPatterns = [
    /^annulation\s*[:\-–]/i,
    /^annule\s*[:\-–]/i,
    /^reporte\s*[:\-–]/i,
    /^supprime\s*[:\-–]/i,
    /^cancel/i,
  ];
  
  for (const pattern of prefixPatterns) {
    if (pattern.test(title)) {
      return true;
    }
  }
  
  // Check for excluded keywords anywhere in title
  return EXCLUDED_EVENT_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return lowerTitle.includes(normalizedKeyword);
  });
}

// Group code patterns for detection - broader patterns
const GROUP_PATTERNS = [
  /\b(TC\d+\s*G?\d*\s*[A-Z]?)\b/gi,            // TC2, TC2 G1 A, TC1G2
  /\b(L[1-3]\s*[-]?\s*[A-Z0-9]*)\b/gi,          // L3-A, L1 B, L2
  /\b(M[1-2]\s*[-]?\s*[A-Z0-9]+)\b/gi,          // M1-A, M2 Info
  /\b(INFO[-\s]?S?\d+)\b/gi,                     // INFO-S3, INFO S2, INFO3
  /\b(Groupe\s*\d+[A-Z]?)\b/gi,                 // Groupe 1A
  /\b(G\d+\s*[A-Z]?)\b/gi,                       // G1A, G2 B
  /\b(S\d+[-\s]?[A-Z0-9]*)\b/gi,                 // S3, S3-A, S5 Info
  /\b(TP\d+[A-Z]?)\b/gi,                         // TP1, TP2A
  /\b(TD\d+[A-Z]?)\b/gi,                         // TD1, TD2B
  /\b([A-Z]{2,6}\d+[-\s]?[A-Z0-9]*)\b/g,         // MIAGE2A, BUT1, GEII2
  /\b(\d{4}[-_][A-Z0-9]+)\b/gi,                  // 2024-INFO, 2025_M1
  /\[\s*([^\]]+)\s*\]/g,                          // [Anything in brackets]
  /\(([A-Z0-9][-A-Z0-9\s]{1,15})\)/g,            // (Anything in parentheses with letters/numbers)
];

// Parse iCal format
function parseICalData(icalData: string): any[] {
  const events: any[] = [];
  const lines = icalData.split(/\r?\n/);
  let currentEvent: any = null;
  let currentKey = '';
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line continuations (lines starting with space or tab)
    if (line.startsWith(' ') || line.startsWith('\t')) {
      currentValue += line.slice(1);
      continue;
    }
    
    // Process previous key-value pair
    if (currentKey && currentEvent) {
      processKeyValue(currentEvent, currentKey, currentValue);
    }
    
    // Check for BEGIN:VEVENT and END:VEVENT first
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      currentKey = '';
      currentValue = '';
      continue;
    } else if (line === 'END:VEVENT' && currentEvent) {
      // Process any remaining key-value pair
      if (currentKey) {
        processKeyValue(currentEvent, currentKey, currentValue);
      }
      events.push(currentEvent);
      currentEvent = null;
      currentKey = '';
      currentValue = '';
      continue;
    }
    
    // Parse new line - handle both "KEY:value" and "KEY;param=x:value"
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    let rawKey = line.substring(0, colonIndex);
    currentValue = line.substring(colonIndex + 1);
    
    // Extract base key (remove parameters like ;LANGUAGE=fr or ;TZID=Europe/Paris)
    const semicolonIndex = rawKey.indexOf(';');
    currentKey = semicolonIndex !== -1 ? rawKey.substring(0, semicolonIndex) : rawKey;
  }

  return events;
}

function processKeyValue(event: any, key: string, value: string) {
  switch (key) {
    case 'UID':
      event.uid = value;
      break;
    case 'SUMMARY':
      event.summary = value.replace(/\\,/g, ',').replace(/\\n/g, '\n');
      break;
    case 'DESCRIPTION':
      event.description = value.replace(/\\,/g, ',').replace(/\\n/g, '\n');
      break;
    case 'LOCATION':
      event.location = value.replace(/\\,/g, ',');
      break;
    case 'DTSTART':
      event.start = parseICalDate(value);
      break;
    case 'DTEND':
      event.end = parseICalDate(value);
      break;
  }
}

function parseICalDate(dateStr: string): Date | null {
  try {
    // Format: 20240115T090000Z or 20240115T090000
    const clean = dateStr.replace(/[TZ]/g, '');
    if (clean.length >= 8) {
      const year = parseInt(clean.substring(0, 4));
      const month = parseInt(clean.substring(4, 6)) - 1;
      const day = parseInt(clean.substring(6, 8));
      const hour = clean.length >= 10 ? parseInt(clean.substring(8, 10)) : 0;
      const minute = clean.length >= 12 ? parseInt(clean.substring(10, 12)) : 0;
      
      return new Date(year, month, day, hour, minute);
    }
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
  }
  return null;
}

// Extract room number from location or description
function extractRoomNumber(location: string | undefined, description: string | undefined): string | null {
  const text = `${location || ''} ${description || ''}`;
  const roomPatterns = [
    /([A-Z]{2,}-[A-Z0-9]+)/i,
    /(?:room|salle|amphi)\s*([A-Z0-9-]+)/i,
    /([A-Z]\d{2,})/i,
  ];
  
  for (const pattern of roomPatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract teacher name from description
function extractTeacher(description: string | undefined): string | null {
  if (!description) return null;
  const patterns = [
    /(?:prof(?:esseur)?|teacher|enseignant|intervenant)[:\s]+([^,\n]+)/i,
    /(?:by|par)[:\s]+([^,\n]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// Detect if event is an exam
function isExamEvent(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return EXAM_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

// Extract all group codes from event text
function extractGroupCodes(text: string): string[] {
  const groups: Set<string> = new Set();
  
  for (const pattern of GROUP_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      const code = match[1].toUpperCase().replace(/\s+/g, ' ').trim();
      if (code.length >= 2 && code.length <= 20) {
        groups.add(code);
      }
    }
  }
  
  return Array.from(groups);
}

// Detect groups from first N events
function detectGroupsFromEvents(events: any[], limit: number = 100): Map<string, number> {
  const groupCounts: Map<string, number> = new Map();
  
  const eventsToScan = events.slice(0, limit);
  
  for (const event of eventsToScan) {
    const textToScan = `${event.summary || ''} ${event.description || ''}`;
    const codes = extractGroupCodes(textToScan);
    
    for (const code of codes) {
      groupCounts.set(code, (groupCounts.get(code) || 0) + 1);
    }
  }
  
  return groupCounts;
}

// Check if event matches the user's group filter
function eventMatchesGroup(event: any, filterGroup: string | null): boolean {
  if (!filterGroup) return true; // No filter, include all
  
  const textToCheck = `${event.summary || ''} ${event.description || ''}`.toUpperCase();
  const normalizedFilter = filterGroup.toUpperCase().replace(/\s+/g, '').trim();
  
  // Check if the filter group appears in the event
  // Also try with spaces removed for flexible matching
  const textNoSpaces = textToCheck.replace(/\s+/g, '');
  
  return textNoSpaces.includes(normalizedFilter) || 
         textToCheck.includes(filterGroup.toUpperCase());
}

// Extract clean subject name from event title (remove group codes)
function extractSubjectName(title: string, filterGroup: string | null): string {
  let clean = title;
  
  // Remove detected group codes
  for (const pattern of GROUP_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  
  // Remove common prefixes/suffixes
  clean = clean
    .replace(/\s*-\s*(S\d+|Groupe\s*\d+|G\d+|TP|TD|CM|Cours|Amphi).*$/i, '')
    .replace(/^\s*(CM|TD|TP|Cours)\s*-?\s*/i, '')
    .replace(/\s*[-–]\s*$/g, '')
    .replace(/^\s*[-–]\s*/g, '')
    .trim();
  
  // If still too long, take first meaningful part
  if (clean.length > 30) {
    clean = clean.split(/[-–]/)[0].trim();
  }
  
  return clean || title;
}

// Format day name in French
function formatDayFr(date: Date): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[date.getDay()];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, icalUrl, syncAll, scanOnly, previewOnly, filterGroup } = await req.json();
    
    // Mode: Scan only - detect groups without syncing
    if (scanOnly && icalUrl) {
      console.log('Scanning for groups (proxy mode)...');
      
      const response = await fetch(icalUrl, {
        headers: { 'User-Agent': 'OrbitPlan-Calendar-Sync/1.0' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch iCal: ${response.status}`);
      }
      
      const icalData = await response.text();
      const events = parseICalData(icalData);
      
      // Log first 10 event titles for debugging
      const sampleTitles = events.slice(0, 10).map(e => e.summary).filter(Boolean);
      console.log('Sample event titles:', JSON.stringify(sampleTitles));
      
      // Scan 100 first events for groups
      const groupCounts = detectGroupsFromEvents(events, 100);
      
      // Sort by count (most common first) and filter noise
      const detectedGroups = Array.from(groupCounts.entries())
        .filter(([_, count]) => count >= 2) // At least 2 occurrences
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15) // Top 15 groups
        .map(([code, count]) => ({ code, count }));
      
      console.log(`Detected ${detectedGroups.length} groups from ${events.length} events`);
      
      // If no groups detected, return event summaries as hint for user
      const eventSummaries = events.slice(0, 5).map(e => e.summary).filter(Boolean);
      
      return new Response(JSON.stringify({ 
        detectedGroups,
        totalEventsScanned: Math.min(events.length, 100),
        sampleTitles: detectedGroups.length === 0 ? eventSummaries : undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Mode: Preview only - show next few events for a group
    if (previewOnly && icalUrl && filterGroup) {
      console.log(`Previewing events for group: ${filterGroup}`);
      
      const response = await fetch(icalUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch iCal: ${response.status}`);
      }
      
      const icalData = await response.text();
      const events = parseICalData(icalData);
      
      const now = new Date();
      const filteredEvents = events
        .filter(e => e.summary && e.start && eventMatchesGroup(e, filterGroup))
        .filter(e => new Date(e.start) >= now)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 5);
      
      const previewEvents = filteredEvents.map(e => ({
        title: extractSubjectName(e.summary, filterGroup),
        time: `${new Date(e.start).getHours().toString().padStart(2, '0')}:${new Date(e.start).getMinutes().toString().padStart(2, '0')}`,
        day: formatDayFr(new Date(e.start)),
      }));
      
      return new Response(JSON.stringify({ previewEvents }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Normal sync mode
    let usersToSync: { user_id: string; ical_url: string; ical_filter_group: string | null }[] = [];
    
    if (syncAll) {
      // Cron job mode: sync all users with valid iCal URLs
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('user_id, ical_url, ical_filter_group')
        .eq('sync_enabled', true)
        .not('ical_url', 'is', null);
      
      if (error) throw error;
      usersToSync = settings || [];
    } else if (userId && icalUrl) {
      // Single user sync mode - get their filter group
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('ical_filter_group')
        .eq('user_id', userId)
        .single();
      
      usersToSync = [{ 
        user_id: userId, 
        ical_url: icalUrl,
        ical_filter_group: filterGroup || userSettings?.ical_filter_group || null
      }];
    } else {
      return new Response(JSON.stringify({ error: 'Missing userId or icalUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const { user_id, ical_url, ical_filter_group } of usersToSync) {
      try {
        console.log(`Syncing calendar for user ${user_id}, filter: ${ical_filter_group || 'none'}`);
        
        // Fetch iCal feed
        const response = await fetch(ical_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch iCal: ${response.status}`);
        }
        
        const icalData = await response.text();
        const allEvents = parseICalData(icalData);
        
        // Current date for filtering
        const now = new Date();
        
        // Apply group filter, time filter, AND exclude non-course events
        const events = allEvents.filter(e => {
          // Skip events without titles
          if (!e.summary) return false;
          
          // Exclude vacations, holidays, study days, etc.
          if (isExcludedEvent(e.summary)) {
            console.log(`Excluding non-course event: ${e.summary}`);
            return false;
          }
          
          // Time filter: only keep events ending after now
          if (e.end) {
            const endDate = new Date(e.end);
            if (endDate < now) return false;
          }
          // Group filter: flexible case-insensitive matching
          return eventMatchesGroup(e, ical_filter_group);
        });
        
        console.log(`Parsed ${allEvents.length} events, ${events.length} after filtering`);
        
        // Get existing subjects for this user
        const { data: existingSubjects } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('user_id', user_id);
        
        const subjectMap = new Map(
          (existingSubjects || []).map(s => [s.name.toLowerCase(), s.id])
        );
        
        // Track new subjects to create
        const newSubjectsToCreate: Set<string> = new Set();
        
        // Process events
        let syncedCount = 0;
        let examsFound = 0;
        
        for (const event of events) {
          if (!event.summary || !event.start || !event.end) continue;
          
          const title = event.summary;
          const subjectName = extractSubjectName(title, ical_filter_group);
          const isExam = isExamEvent(title);
          
          // Check if we need to create this subject
          if (!subjectMap.has(subjectName.toLowerCase())) {
            newSubjectsToCreate.add(subjectName);
          }
          
          if (isExam) examsFound++;
        }
        
        // Create new subjects with SMART icons based on subject name
        for (const subjectName of newSubjectsToCreate) {
          const { icon, color } = getSmartIconAndColor(subjectName);
          
          const { data: newSubject, error } = await supabase
            .from('subjects')
            .insert({
              user_id: user_id,
              name: subjectName,
              icon: icon,
              color_key: color,
            })
            .select()
            .single();
          
          if (!error && newSubject) {
            subjectMap.set(subjectName.toLowerCase(), newSubject.id);
            console.log(`Created subject "${subjectName}" with icon ${icon}`);
          }
        }
        
        // Now upsert all events
        const eventsToInsert = [];
        
        for (const event of events) {
          if (!event.summary || !event.start || !event.end) continue;
          
          const title = event.summary;
          const subjectName = extractSubjectName(title, ical_filter_group);
          const isExam = isExamEvent(title);
          const roomNumber = extractRoomNumber(event.location, event.description);
          const teacherName = extractTeacher(event.description);
          const subjectId = subjectMap.get(subjectName.toLowerCase()) || null;
          
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          
          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.log(`Skipping event with invalid dates: ${title}`);
            continue;
          }
          
          const externalId = event.uid || `${title}-${startDate.toISOString()}`;
          
          eventsToInsert.push({
            user_id: user_id,
            external_id: externalId,
            title: subjectName, // Use clean subject name instead of raw title
            subject_id: subjectId,
            start_time: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
            end_time: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
            day_of_week: startDate.getDay(),
            event_type: isExam ? 'exam' : 'class',
            exam_date: isExam ? startDate.toISOString().split('T')[0] : null,
            room_number: roomNumber,
            teacher_name: teacherName,
          });
        }
        
        console.log(`Prepared ${eventsToInsert.length} events for insertion`);
        
        // Delete existing synced events for this user and insert fresh
        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', user_id)
          .not('external_id', 'is', null);
        
        if (deleteError) {
          console.error('Error deleting old events:', deleteError);
        }
        
        // Insert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < eventsToInsert.length; i += batchSize) {
          const batch = eventsToInsert.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from('calendar_events')
            .insert(batch);
          
          if (insertError) {
            console.error(`Error inserting batch ${i / batchSize}:`, insertError);
          } else {
            syncedCount += batch.length;
          }
        }
        
        console.log(`Successfully synced ${syncedCount} events`);
        
        // Update last synced timestamp
        await supabase
          .from('user_settings')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('user_id', user_id);
        
        results.push({
          user_id,
          success: true,
          eventsFound: allEvents.length,
          eventsFiltered: events.length,
          eventsSynced: syncedCount,
          newSubjects: newSubjectsToCreate.size,
          examsFound,
          filterApplied: ical_filter_group || null,
        });
        
      } catch (userError: unknown) {
        console.error(`Error syncing user ${user_id}:`, userError);
        const message = userError instanceof Error ? userError.message : 'Unknown error';
        results.push({
          user_id,
          success: false,
          error: message,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in sync-calendar function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
