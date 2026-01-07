import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

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

export const useOrbitData = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [subjectsRes, eventsRes, notesRes, tasksRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('calendar_events').select('*').order('day_of_week, start_time'),
        supabase.from('notes_vault').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('priority_score', { ascending: false }),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (notesRes.error) throw notesRes.error;
      if (tasksRes.error) throw tasksRes.error;

      setSubjects(subjectsRes.data || []);
      setEvents(eventsRes.data as CalendarEvent[] || []);
      setNotes(notesRes.data as Note[] || []);
      setTasks(tasksRes.data as Task[] || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Create subject
  const createSubject = async (data: Omit<Subject, 'id'>) => {
    if (!user) return null;
    
    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create subject');
      return null;
    }

    setSubjects(prev => [...prev, newSubject]);
    return newSubject;
  };

  // Create event
  const createEvent = async (data: Omit<CalendarEvent, 'id'>) => {
    if (!user) return null;

    const { data: newEvent, error } = await supabase
      .from('calendar_events')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create event');
      return null;
    }

    setEvents(prev => [...prev, newEvent as CalendarEvent]);
    // Refresh tasks in case exam triggers created new tasks
    fetchData();
    return newEvent;
  };

  // Create note
  const createNote = async (data: Partial<Note>) => {
    if (!user) return null;

    const { data: newNote, error } = await supabase
      .from('notes_vault')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create note');
      return null;
    }

    setNotes(prev => [newNote as Note, ...prev]);
    return newNote;
  };

  // Create task
  const createTask = async (data: Partial<Task>) => {
    if (!user) return null;

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({ 
        title: data.title || 'New Task',
        user_id: user.id,
        priority_score: data.priority_score,
        energy_level: data.energy_level,
        due_date: data.due_date,
        subject_id: data.subject_id,
        linked_note_id: data.linked_note_id,
        parent_task_id: data.parent_task_id,
        is_subtask: data.is_subtask,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create task');
      return null;
    }

    setTasks(prev => [newTask as Task, ...prev]);
    return newTask;
  };

  // Toggle task status
  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'todo' : 'done';

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to update task');
      return;
    }

    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));
  };

  // Get current class based on time
  const getCurrentClass = (): CalendarEvent | null => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    const currentDay = now.getDay();

    const todayClasses = events.filter(e => e.day_of_week === currentDay && e.event_type === 'class');

    for (const event of todayClasses) {
      const [startHour, startMin] = event.start_time.split(':').map(Number);
      const [endHour, endMin] = event.end_time.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime >= startTime && currentTime <= endTime) {
        return event;
      }
    }

    return null;
  };

  // Get next class
  const getNextClass = (): CalendarEvent | null => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    const currentDay = now.getDay();

    const todayClasses = events
      .filter(e => e.day_of_week === currentDay && e.event_type === 'class')
      .sort((a, b) => {
        const [aH, aM] = a.start_time.split(':').map(Number);
        const [bH, bM] = b.start_time.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
      });

    for (const event of todayClasses) {
      const [startHour, startMin] = event.start_time.split(':').map(Number);
      const startTime = startHour * 60 + startMin;

      if (currentTime < startTime) {
        return event;
      }
    }

    // Return first class of next day
    const tomorrow = (currentDay + 1) % 7;
    const tomorrowClasses = events.filter(e => e.day_of_week === tomorrow && e.event_type === 'class');
    return tomorrowClasses[0] || null;
  };

  // Get subject by ID
  const getSubjectById = (id: string | null): Subject | undefined => {
    if (!id) return undefined;
    return subjects.find(s => s.id === id);
  };

  // Get highest priority task
  const getHighestPriorityTask = (): Task | undefined => {
    return tasks
      .filter(t => t.status === 'todo' && !t.is_subtask)
      .sort((a, b) => b.priority_score - a.priority_score)[0];
  };

  // Get notes by subject
  const getNotesBySubject = (subjectId: string): Note[] => {
    return notes.filter(n => n.subject_id === subjectId);
  };

  // Get upcoming exams
  const getUpcomingExams = (): CalendarEvent[] => {
    const today = new Date();
    return events
      .filter(e => e.event_type === 'exam' && e.exam_date && new Date(e.exam_date) >= today)
      .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime());
  };

  return {
    subjects,
    events,
    notes,
    tasks,
    loading,
    createSubject,
    createEvent,
    createNote,
    createTask,
    toggleTask,
    getCurrentClass,
    getNextClass,
    getSubjectById,
    getHighestPriorityTask,
    getNotesBySubject,
    getUpcomingExams,
    refetch: fetchData,
  };
};
