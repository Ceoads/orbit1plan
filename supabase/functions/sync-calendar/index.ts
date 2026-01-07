import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Task-worthy event keywords (only these create tasks)
const TASK_KEYWORDS = [
  'exam', 'examen', 'test', 'ds', 'final', 'partiel', 
  'controle', 'épreuve', 'quiz', 'midterm', 'assessment',
  'rendu', 'deadline', 'projet', 'presentation', 'soutenance',
  'devoir', 'rapport', 'assignment', 'homework', 'due'
];

// Exam-specific keywords (subset of task keywords)
const EXAM_KEYWORDS = [
  'exam', 'examen', 'test', 'ds', 'final', 'partiel', 
  'controle', 'épreuve', 'quiz', 'midterm', 'assessment'
];

// Parse iCal format
function parseICalData(icalData: string): any[] {
  const events: any[] = [];
  const lines = icalData.split(/\r?\n/);
  let currentEvent: any = null;
  
  // First, unfold lines (lines starting with space/tab are continuations)
  const unfoldedLines: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfoldedLines.length > 0) {
      unfoldedLines[unfoldedLines.length - 1] += line.slice(1);
    } else {
      unfoldedLines.push(line);
    }
  }

  for (const line of unfoldedLines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      continue;
    }
    
    if (line === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
      continue;
    }
    
    if (!currentEvent) continue;
    
    // Parse key:value or key;params:value
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    let key = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);
    
    // Handle keys with parameters like DTSTART;TZID=Europe/Paris:20240115T090000
    if (key.includes(';')) {
      key = key.split(';')[0];
    }
    
    switch (key) {
      case 'UID':
        currentEvent.uid = value;
        break;
      case 'SUMMARY':
        currentEvent.summary = value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
        break;
      case 'DESCRIPTION':
        currentEvent.description = value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
        break;
      case 'LOCATION':
        currentEvent.location = value.replace(/\\,/g, ',').replace(/\\;/g, ';');
        break;
      case 'DTSTART':
        currentEvent.start = parseICalDate(value);
        break;
      case 'DTEND':
        currentEvent.end = parseICalDate(value);
        break;
    }
  }

  return events;
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
  // Common room patterns: IUTC-514, Room 101, Salle A2, etc.
  const roomPatterns = [
    /([A-Z]{2,}-[A-Z0-9]+)/i,      // IUTC-514
    /(?:room|salle|amphi)\s*([A-Z0-9-]+)/i,  // Room 101, Salle A2
    /([A-Z]\d{2,})/i,              // A101
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
  // Common patterns: "Prof: Name", "Enseignant: Name", etc.
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

// Extract subject name from event title
function extractSubjectName(title: string): string {
  // Remove common prefixes/suffixes
  let clean = title
    .replace(/\s*-\s*(S\d+|Groupe\s*\d+|G\d+|TP|TD|CM|Cours|Amphi).*$/i, '')
    .replace(/^\s*(CM|TD|TP|Cours)\s*-?\s*/i, '')
    .trim();
  
  // If still too long, take first meaningful part
  if (clean.length > 30) {
    clean = clean.split(/[-–]/)[0].trim();
  }
  
  return clean || title;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, icalUrl, syncAll } = await req.json();
    
    let usersToSync: { user_id: string; ical_url: string }[] = [];
    
    if (syncAll) {
      // Cron job mode: sync all users with valid iCal URLs
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('user_id, ical_url')
        .eq('sync_enabled', true)
        .not('ical_url', 'is', null);
      
      if (error) throw error;
      usersToSync = settings || [];
    } else if (userId && icalUrl) {
      // Single user sync mode
      usersToSync = [{ user_id: userId, ical_url: icalUrl }];
    } else {
      return new Response(JSON.stringify({ error: 'Missing userId or icalUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const { user_id, ical_url } of usersToSync) {
      try {
        console.log(`Syncing calendar for user ${user_id}`);
        
        // Fetch iCal feed
        const response = await fetch(ical_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch iCal: ${response.status}`);
        }
        
        const icalData = await response.text();
        const events = parseICalData(icalData);
        
        console.log(`Parsed ${events.length} events`);
        
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
          const subjectName = extractSubjectName(title);
          const isExam = isExamEvent(title);
          const roomNumber = extractRoomNumber(event.location, event.description);
          const teacherName = extractTeacher(event.description);
          
          // Check if we need to create this subject
          if (!subjectMap.has(subjectName.toLowerCase())) {
            newSubjectsToCreate.add(subjectName);
          }
          
          if (isExam) examsFound++;
        }
        
        // Create new subjects
        const subjectIcons = ['📐', '📜', '⚡', '📚', '🧪', '🌍', '🎨', '💻', '🔬', '📊'];
        const subjectColors = ['math', 'history', 'physics', 'english', 'chemistry'];
        let iconIndex = existingSubjects?.length || 0;
        
        for (const subjectName of newSubjectsToCreate) {
          const { data: newSubject, error } = await supabase
            .from('subjects')
            .insert({
              user_id: user_id,
              name: subjectName,
              icon: subjectIcons[iconIndex % subjectIcons.length],
              color_key: subjectColors[iconIndex % subjectColors.length],
            })
            .select()
            .single();
          
          if (!error && newSubject) {
            subjectMap.set(subjectName.toLowerCase(), newSubject.id);
            iconIndex++;
          }
        }
        
        // Now upsert all events
        const eventsToInsert = [];
        let skippedNoData = 0;
        let skippedInvalidDates = 0;
        
        // Log first event for debugging
        if (events.length > 0) {
          console.log('Sample event:', JSON.stringify(events[0]));
        }
        
        for (const event of events) {
          if (!event.summary || !event.start || !event.end) {
            skippedNoData++;
            continue;
          }
          
          const title = event.summary;
          const subjectName = extractSubjectName(title);
          const isExam = isExamEvent(title);
          const roomNumber = extractRoomNumber(event.location, event.description);
          const teacherName = extractTeacher(event.description);
          const subjectId = subjectMap.get(subjectName.toLowerCase()) || null;
          
          // event.start and event.end are already Date objects from parseICalDate
          const startDate = event.start instanceof Date ? event.start : new Date(event.start);
          const endDate = event.end instanceof Date ? event.end : new Date(event.end);
          
          // Validate dates
          if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            skippedInvalidDates++;
            continue;
          }
          
          const externalId = event.uid || `${title}-${startDate.toISOString()}`;
          
          eventsToInsert.push({
            user_id: user_id,
            external_id: externalId,
            title: title,
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
        
        console.log(`Skipped ${skippedNoData} events with missing data, ${skippedInvalidDates} with invalid dates`);
        
        console.log(`Prepared ${eventsToInsert.length} events for insertion`);
        
        // Delete existing events for this user and insert fresh
        // This is more reliable than upsert with the partial unique index
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
          eventsFound: events.length,
          eventsSynced: syncedCount,
          newSubjects: newSubjectsToCreate.size,
          examsFound,
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
