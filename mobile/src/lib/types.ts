/**
 * Shared domain types for Orbit data, mirrored from the web app's
 * src/hooks/useOrbitData.tsx so they can be reused without pulling in
 * the full data-fetching hook.
 */

export interface Subject {
  id: string;
  name: string;
  color_key: string;
  teacher_name: string | null;
  icon: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  subject_id: string | null;
  start_time: string;
  end_time: string;
  day_of_week: number;
  event_type: 'class' | 'exam';
  exam_date: string | null;
  event_date: string | null;
  room_number: string | null;
  teacher_name: string | null;
  external_id: string | null;
}

export interface Note {
  id: string;
  subject_id: string | null;
  event_id: string | null;
  media_url: string | null;
  raw_text: string | null;
  ai_summary: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'done';
  priority_score: number;
  energy_level: 'low' | 'medium' | 'high';
  due_date: string | null;
  subject_id: string | null;
  linked_note_id: string | null;
  parent_task_id: string | null;
  is_subtask: boolean;
}
