import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  
  return { icon: '📚', color: 'english' };
}

// Check if event should be excluded
function isExcludedEvent(title: string): boolean {
  const lowerTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
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
  
  return EXCLUDED_EVENT_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return lowerTitle.includes(normalizedKeyword);
  });
}

// Group code patterns for detection
const GROUP_PATTERNS = [
  /\b(TC\d+\s*G?\d*\s*[A-Z]?)\b/gi,
  /\b(L[1-3]\s*[-]?\s*[A-Z0-9]*)\b/gi,
  /\b(M[1-2]\s*[-]?\s*[A-Z0-9]+)\b/gi,
  /\b(INFO[-\s]?S?\d+)\b/gi,
  /\b(Groupe\s*\d+[A-Z]?)\b/gi,
  /\b(G\d+\s*[A-Z]?)\b/gi,
  /\b(S\d+[-\s]?[A-Z0-9]*)\b/gi,
  /\b(TP\d+[A-Z]?)\b/gi,
  /\b(TD\d+[A-Z]?)\b/gi,
  /\b([A-Z]{2,6}\d+[-\s]?[A-Z0-9]*)\b/g,
  /\b(\d{4}[-_][A-Z0-9]+)\b/gi,
  /\[\s*([^\]]+)\s*\]/g,
  /\(([A-Z0-9][-A-Z0-9\s]{1,15})\)/g,
];

/**
 * Force-decode a potentially mis-encoded string to proper UTF-8.
 * Handles common Latin-1 → UTF-8 mojibake (e.g. "MathÃ©matiques" → "Mathématiques").
 */
function forceUtf8(text: string): string {
  try {
    // Detect mojibake patterns (common Latin-1 interpreted as UTF-8)
    if (/Ã[©¨ª«¯°²³´µ¹º¼½¾¿]|Ã\u0083|Ã\u0082/.test(text)) {
      // Try to re-encode as Latin-1 then decode as UTF-8
      const bytes = new Uint8Array(text.split('').map(c => c.charCodeAt(0)));
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (decoded && !decoded.includes('\uFFFD')) {
        return decoded;
      }
    }
  } catch (_) {
    // fallback to original
  }
  return text;
}

/**
 * Get Europe/Paris UTC offset in minutes for a given UTC timestamp.
 * Handles CET (UTC+1) and CEST (UTC+2) transitions.
 */
function getParisOffsetMinutes(utcMs: number): number {
  // Use Intl to reliably determine the offset
  try {
    const date = new Date(utcMs);
    const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const parisStr = date.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
    const utcDate = new Date(utcStr);
    const parisDate = new Date(parisStr);
    return (parisDate.getTime() - utcDate.getTime()) / 60000;
  } catch (_) {
    // Fallback: assume CET (UTC+1)
    return 60;
  }
}

/**
 * Parse iCal date and return Paris time components directly.
 * Returns an object with { year, month, day, hour, minute, second, dayOfWeek }
 * all in Europe/Paris timezone.
 */
interface ParsedDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
  toDate(): Date;
}

function parseICalDate(dateStr: string, tzid?: string): ParsedDate | null {
  try {
    const isUtc = dateStr.endsWith('Z');
    const clean = dateStr.replace(/[Z]/g, '');
    
    if (clean.length < 8) return null;
    
    const year = parseInt(clean.substring(0, 4));
    const month = parseInt(clean.substring(4, 6)) - 1;
    const day = parseInt(clean.substring(6, 8));
    const hour = clean.length >= 10 ? parseInt(clean.substring(8, 10)) : 0;
    const minute = clean.length >= 12 ? parseInt(clean.substring(10, 12)) : 0;
    const second = clean.length >= 14 ? parseInt(clean.substring(12, 14)) : 0;

    const makeParsedDate = (h: number, m: number, s: number, y: number, mo: number, d: number): ParsedDate => {
      const dateObj = new Date(Date.UTC(y, mo, d, h, m, s));
      return {
        year: y, month: mo, day: d, hour: h, minute: m, second: s,
        dayOfWeek: dateObj.getUTCDay(),
        toDate() { return dateObj; }
      };
    };
    
    if (isUtc) {
      // UTC date — convert to Europe/Paris local time
      const utcMs = Date.UTC(year, month, day, hour, minute, second);
      const offsetMin = getParisOffsetMinutes(utcMs);
      const parisMs = utcMs + offsetMin * 60000;
      const parisDate = new Date(parisMs);
      return {
        year: parisDate.getUTCFullYear(),
        month: parisDate.getUTCMonth(),
        day: parisDate.getUTCDate(),
        hour: parisDate.getUTCHours(),
        minute: parisDate.getUTCMinutes(),
        second: parisDate.getUTCSeconds(),
        dayOfWeek: parisDate.getUTCDay(),
        toDate() { return new Date(utcMs); }
      };
    }
    
    // Check if TZID is Europe/Paris or similar — already local Paris time
    if (!tzid || (tzid && /europe\/paris/i.test(tzid))) {
      return makeParsedDate(hour, minute, second, year, month, day);
    }
    
    // If TZID is another timezone, convert to Paris
    try {
      const srcUtcMs = Date.UTC(year, month, day, hour, minute, second);
      // The given time is in the source timezone, so we need to find the UTC equivalent first
      // srcTime = UTC + srcOffset, so UTC = srcTime - srcOffset
      const srcOffsetMin = getParisOffsetMinutes(srcUtcMs); // approximate
      // Use Intl for source timezone offset
      const srcDate = new Date(srcUtcMs);
      const srcStr = srcDate.toLocaleString('en-US', { timeZone: tzid });
      const srcLocal = new Date(srcStr);
      const utcStr = srcDate.toLocaleString('en-US', { timeZone: 'UTC' });
      const utcLocal = new Date(utcStr);
      const srcTzOffset = (srcLocal.getTime() - utcLocal.getTime()) / 60000;
      
      // Convert source local time to UTC
      const realUtcMs = srcUtcMs - srcTzOffset * 60000;
      // Then convert UTC to Paris
      const parisOffset = getParisOffsetMinutes(realUtcMs);
      const parisMs = realUtcMs + parisOffset * 60000;
      const parisDate = new Date(parisMs);
      
      return {
        year: parisDate.getUTCFullYear(),
        month: parisDate.getUTCMonth(),
        day: parisDate.getUTCDate(),
        hour: parisDate.getUTCHours(),
        minute: parisDate.getUTCMinutes(),
        second: parisDate.getUTCSeconds(),
        dayOfWeek: parisDate.getUTCDay(),
        toDate() { return new Date(realUtcMs); }
      };
    } catch (_) {
      return makeParsedDate(hour, minute, second, year, month, day);
    }
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return null;
  }
}

// Parse iCal format with improved encoding & timezone handling
function parseICalData(icalData: string): any[] {
  // Force UTF-8 cleanup on entire input
  const cleanData = forceUtf8(icalData);
  
  const events: any[] = [];
  const lines = cleanData.split(/\r?\n/);
  let currentEvent: any = null;
  let currentKey = '';
  let currentValue = '';
  let currentParams = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line continuations (lines starting with space or tab)
    if (line.startsWith(' ') || line.startsWith('\t')) {
      currentValue += line.slice(1);
      continue;
    }
    
    // Process previous key-value pair
    if (currentKey && currentEvent) {
      processKeyValue(currentEvent, currentKey, currentValue, currentParams);
    }
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      currentKey = '';
      currentValue = '';
      currentParams = '';
      continue;
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentKey) {
        processKeyValue(currentEvent, currentKey, currentValue, currentParams);
      }
      events.push(currentEvent);
      currentEvent = null;
      currentKey = '';
      currentValue = '';
      currentParams = '';
      continue;
    }
    
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    let rawKey = line.substring(0, colonIndex);
    currentValue = line.substring(colonIndex + 1);
    
    // Extract base key and parameters (e.g. DTSTART;TZID=Europe/Paris)
    const semicolonIndex = rawKey.indexOf(';');
    if (semicolonIndex !== -1) {
      currentKey = rawKey.substring(0, semicolonIndex);
      currentParams = rawKey.substring(semicolonIndex + 1);
    } else {
      currentKey = rawKey;
      currentParams = '';
    }
  }

  return events;
}

function processKeyValue(event: any, key: string, value: string, params: string = '') {
  // Extract TZID from parameters if present
  const tzidMatch = params.match(/TZID=([^;:]+)/i);
  const tzid = tzidMatch ? tzidMatch[1] : undefined;
  
  switch (key) {
    case 'UID':
      event.uid = value;
      break;
    case 'SUMMARY':
      event.summary = forceUtf8(value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';'));
      break;
    case 'DESCRIPTION':
      event.description = forceUtf8(value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';'));
      break;
    case 'LOCATION':
      event.location = forceUtf8(value.replace(/\\,/g, ','));
      break;
    case 'DTSTART':
      event.start = parseICalDate(value, tzid);
      break;
    case 'DTEND':
      event.end = parseICalDate(value, tzid);
      break;
  }
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
  // If location is short (likely a room name), return it directly
  if (location && location.trim().length > 0 && location.trim().length <= 30) {
    return location.trim();
  }
  return null;
}

// Extract teacher name from description
function extractTeacher(description: string | undefined): string | null {
  if (!description) return null;
  const patterns = [
    /(?:prof(?:esseur)?|teacher|enseignant|intervenant)[:\s]+([^,\n]+)/i,
    /(?:by|par)[:\s]+([^,\n]+)/i,
    // Pronote pattern: teacher name often on first or last line
    /^([A-Z][a-zéèêëàâäîïôöùûü]+ [A-Z][a-zéèêëàâäîïôöùûü]+)/m,
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
  if (!filterGroup) return true;
  
  const textToCheck = `${event.summary || ''} ${event.description || ''}`.toUpperCase();
  const normalizedFilter = filterGroup.toUpperCase().replace(/\s+/g, '').trim();
  const textNoSpaces = textToCheck.replace(/\s+/g, '');
  
  return textNoSpaces.includes(normalizedFilter) || 
         textToCheck.includes(filterGroup.toUpperCase());
}

// Extract clean subject name from event title
function extractSubjectName(title: string, filterGroup: string | null): string {
  let clean = title;
  
  for (const pattern of GROUP_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  
  clean = clean
    .replace(/\s*-\s*(S\d+|Groupe\s*\d+|G\d+|TP|TD|CM|Cours|Amphi).*$/i, '')
    .replace(/^\s*(CM|TD|TP|Cours)\s*-?\s*/i, '')
    .replace(/\s*[-–]\s*$/g, '')
    .replace(/^\s*[-–]\s*/g, '')
    .trim();
  
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

/**
 * Fetch iCal data with proper encoding handling.
 * Handles webcal:// protocol, forces UTF-8 decoding, and provides
 * clear error messages for expired links (401/403).
 */
async function fetchICalData(url: string): Promise<string> {
  // Normalize webcal:// to https://
  const normalizedUrl = url.replace(/^webcal:\/\//i, 'https://');
  
  const response = await fetch(normalizedUrl, {
    headers: { 
      'User-Agent': 'OrbitPlan-Calendar-Sync/2.0',
      'Accept': 'text/calendar, text/plain, */*',
      'Accept-Charset': 'utf-8',
    },
  });
  
  if (response.status === 401 || response.status === 403) {
    throw new Error('ICAL_EXPIRED: Ton lien iCal a expiré. Régénère-le dans ton ENT (Pronote, Hyperplanning, etc.).');
  }
  
  if (response.status === 404) {
    throw new Error('ICAL_NOT_FOUND: Ce lien iCal est introuvable. Vérifie l\'URL dans les paramètres de ton école.');
  }
  
  if (!response.ok) {
    throw new Error(`ICAL_FETCH_ERROR: Erreur ${response.status} lors de la récupération du calendrier.`);
  }
  
  // Try to get content as ArrayBuffer for proper encoding handling
  const contentType = response.headers.get('content-type') || '';
  
  // Check if charset is specified
  if (contentType.includes('charset=') && !contentType.includes('utf-8')) {
    // Read as bytes and decode with proper charset
    const buffer = await response.arrayBuffer();
    // Try UTF-8 first
    const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    // Check for replacement characters indicating bad decode
    if (!utf8Text.includes('\uFFFD')) {
      return utf8Text;
    }
    // Fallback to latin-1
    return new TextDecoder('iso-8859-1').decode(buffer);
  }
  
  // Default: read as text (browser default UTF-8)
  const text = await response.text();
  return text;
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
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: authUser }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const authenticatedUserId = authUser.id;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, icalUrl, syncAll, scanOnly, previewOnly, filterGroup } = await req.json();

    // Validate that the requested userId matches the authenticated user (prevent unauthorized access)
    if (userId && userId !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: 'Forbidden: cannot sync for another user' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Mode: Scan only - detect groups without syncing
    if (scanOnly && icalUrl) {
      console.log('Scanning for groups (proxy mode)...');
      
      const icalData = await fetchICalData(icalUrl);
      const events = parseICalData(icalData);
      
      const sampleTitles = events.slice(0, 10).map(e => e.summary).filter(Boolean);
      console.log('Sample event titles:', JSON.stringify(sampleTitles));
      
      const groupCounts = detectGroupsFromEvents(events, 100);
      
      const detectedGroups = Array.from(groupCounts.entries())
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([code, count]) => ({ code, count }));
      
      console.log(`Detected ${detectedGroups.length} groups from ${events.length} events`);
      
      const eventSummaries = events.slice(0, 5).map(e => e.summary).filter(Boolean);
      
      return new Response(JSON.stringify({ 
        detectedGroups,
        totalEventsScanned: Math.min(events.length, 100),
        sampleTitles: detectedGroups.length === 0 ? eventSummaries : undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Mode: Preview only
    if (previewOnly && icalUrl && filterGroup) {
      console.log(`Previewing events for group: ${filterGroup}`);
      
      const icalData = await fetchICalData(icalUrl);
      const events = parseICalData(icalData);
      
      const now = new Date();
      const filteredEvents = events
        .filter(e => e.summary && e.start && eventMatchesGroup(e, filterGroup))
        .filter(e => e.start.toDate() >= now)
        .sort((a, b) => a.start.toDate().getTime() - b.start.toDate().getTime())
        .slice(0, 5);
      
      const previewEvents = filteredEvents.map(e => ({
        title: extractSubjectName(e.summary, filterGroup),
        time: `${e.start.hour.toString().padStart(2, '0')}:${e.start.minute.toString().padStart(2, '0')}`,
        day: formatDayFr(e.start.toDate()),
      }));
      
      return new Response(JSON.stringify({ previewEvents }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Normal sync mode
    let usersToSync: { user_id: string; ical_url: string; ical_filter_group: string | null }[] = [];
    
    if (syncAll) {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('user_id, ical_url, ical_filter_group')
        .eq('sync_enabled', true)
        .not('ical_url', 'is', null);
      
      if (error) throw error;
      usersToSync = settings || [];
    } else if (userId && icalUrl) {
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
        
        const icalData = await fetchICalData(ical_url);
        const allEvents = parseICalData(icalData);
        
        const now = new Date();
        
        const events = allEvents.filter(e => {
          if (!e.summary) return false;
          if (isExcludedEvent(e.summary)) {
            console.log(`Excluding non-course event: ${e.summary}`);
            return false;
          }
          if (e.end) {
            const endDate = new Date(e.end);
            if (endDate < now) return false;
          }
          return eventMatchesGroup(e, ical_filter_group);
        });
        
        console.log(`Parsed ${allEvents.length} events, ${events.length} after filtering`);
        
        const { data: existingSubjects } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('user_id', user_id);
        
        const subjectMap = new Map(
          (existingSubjects || []).map(s => [s.name.toLowerCase(), s.id])
        );
        
        const newSubjectsToCreate: Set<string> = new Set();
        let syncedCount = 0;
        let examsFound = 0;
        
        for (const event of events) {
          if (!event.summary || !event.start || !event.end) continue;
          
          const title = event.summary;
          const subjectName = extractSubjectName(title, ical_filter_group);
          const isExam = isExamEvent(title);
          
          if (!subjectMap.has(subjectName.toLowerCase())) {
            newSubjectsToCreate.add(subjectName);
          }
          
          if (isExam) examsFound++;
        }
        
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
        
        const eventsToInsert = [];
        
        for (const event of events) {
          if (!event.summary || !event.start || !event.end) continue;
          
          const title = event.summary;
          const subjectName = extractSubjectName(title, ical_filter_group);
          const isExam = isExamEvent(title);
          const roomNumber = extractRoomNumber(event.location, event.description);
          const teacherName = extractTeacher(event.description);
          const subjectId = subjectMap.get(subjectName.toLowerCase()) || null;
          
          const startParsed = event.start;
          const endParsed = event.end;
          
          const externalId = event.uid || `${title}-${startParsed.toDate().toISOString()}`;
          
          // Format exam_date using Paris date components
          const examDateStr = isExam 
            ? `${startParsed.year}-${(startParsed.month + 1).toString().padStart(2, '0')}-${startParsed.day.toString().padStart(2, '0')}`
            : null;
          
          eventsToInsert.push({
            user_id: user_id,
            external_id: externalId,
            title: subjectName,
            subject_id: subjectId,
            start_time: `${startParsed.hour.toString().padStart(2, '0')}:${startParsed.minute.toString().padStart(2, '0')}`,
            end_time: `${endParsed.hour.toString().padStart(2, '0')}:${endParsed.minute.toString().padStart(2, '0')}`,
            day_of_week: startParsed.dayOfWeek,
            event_type: isExam ? 'exam' : 'class',
            exam_date: examDateStr,
            room_number: roomNumber,
            teacher_name: teacherName,
          });
        }
        
        console.log(`Prepared ${eventsToInsert.length} events for insertion`);
        
        // Delete existing synced events and insert fresh (deduplicated by UID)
        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', user_id)
          .not('external_id', 'is', null);
        
        if (deleteError) {
          console.error('Error deleting old events:', deleteError);
        }
        
        // Deduplicate by external_id before insertion
        const uniqueEvents = new Map<string, any>();
        for (const event of eventsToInsert) {
          uniqueEvents.set(event.external_id, event);
        }
        const deduplicatedEvents = Array.from(uniqueEvents.values());
        
        const batchSize = 100;
        for (let i = 0; i < deduplicatedEvents.length; i += batchSize) {
          const batch = deduplicatedEvents.slice(i, i + batchSize);
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
    
    // Return user-friendly error for known error types
    const status = message.startsWith('ICAL_') ? 400 : 500;
    
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
