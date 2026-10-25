import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readAllPages } from "@/lib/pagedRead";
import { toLocalDateStr } from "@/lib/dateFormat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { filterEventsByGroup, FilteredEvent } from "@/lib/eventFilter";

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

export const useOrbitData = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const client = useQueryClient();
  const key = ["orbit-data", user?.id];
  type OrbitData = { subjects: Subject[]; events: CalendarEvent[]; notes: Note[]; tasks: Task[]; userGroup: string | null };
  const query = useQuery<OrbitData>({
    queryKey: key, enabled: !!user, staleTime: 60000, gcTime: 300000, refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!user) throw new Error('Not signed in');
      const [subjects, events, notes, tasks, settings] = await Promise.all([
        readAllPages<Subject>((from, to) => supabase.from('subjects').select('id,name,color_key,teacher_name,icon').eq('user_id', user.id).order('name').order('id').range(from, to)),
        readAllPages<CalendarEvent>((from, to) => supabase.from('calendar_events').select('id,title,subject_id,start_time,end_time,day_of_week,event_type,exam_date,event_date,room_number,teacher_name,external_id').eq('user_id', user.id).order('event_date').order('start_time').order('id').range(from, to)),
        readAllPages<Note>((from, to) => supabase.from('notes_vault').select('id,subject_id,event_id,media_url,raw_text,ai_summary,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).order('id').range(from, to)),
        readAllPages<Task>((from, to) => supabase.from('tasks').select('id,title,status,priority_score,energy_level,due_date,subject_id,linked_note_id,parent_task_id,is_subtask').eq('user_id', user.id).order('priority_score', { ascending: false }).order('id').range(from, to)),
        supabase.from('user_settings').select('ical_filter_group').eq('user_id', user.id).maybeSingle(),
      ]);
      if (settings.error) throw settings.error;
      return { subjects, events, notes, tasks, userGroup: settings.data?.ical_filter_group ?? null };
    },
  });
  const { subjects = [], events = [], notes = [], tasks = [], userGroup = null } = query.data ?? {};
  const loading = !!user && query.isPending;
  const fetchData = () => query.refetch();
  const updateCollection = <K extends 'subjects' | 'events' | 'notes' | 'tasks'>(field: K, update: (prev: OrbitData[K]) => OrbitData[K]) => {
    client.setQueryData<OrbitData>(key, prev => prev ? { ...prev, [field]: update(prev[field]) } : prev);
  };
  const setSubjects = (update: (prev: Subject[]) => Subject[]) => updateCollection('subjects', update);
  const setEvents = (update: (prev: CalendarEvent[]) => CalendarEvent[]) => updateCollection('events', update);
  const setNotes = (update: (prev: Note[]) => Note[]) => updateCollection('notes', update);
  const setTasks = (update: (prev: Task[]) => Task[]) => updateCollection('tasks', update);
  useEffect(() => { if (query.error) toast.error(t('toasts.errorLoading')); }, [query.error, t]);

  // Filter events by user's group
  const filteredEvents: FilteredEvent[] = useMemo(
    () => filterEventsByGroup(events, userGroup),
    [events, userGroup]
  );

  // Create subject
  const createSubject = async (data: Omit<Subject, 'id'>) => {
    if (!user) return null;
    
    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error(t('toasts.errorCreating'));
      return null;
    }

    setSubjects(prev => [...prev, newSubject]);
    toast.success(t('toasts.subjectCreated'));
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
      toast.error(t('toasts.errorCreating'));
      return null;
    }

    setEvents(prev => [...prev, newEvent as CalendarEvent]);
    toast.success(t('toasts.eventCreated'));
    // Refresh tasks in case exam triggers created new tasks
    const refreshedTasks = await readAllPages<Task>((from, to) => supabase.from('tasks').select('id,title,status,priority_score,energy_level,due_date,subject_id,linked_note_id,parent_task_id,is_subtask').eq('user_id', user.id).order('priority_score', { ascending: false }).order('id').range(from, to)).catch(() => null);
    if (refreshedTasks) setTasks(() => refreshedTasks);
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
      toast.error(t('toasts.errorCreating'));
      return null;
    }

    setNotes(prev => [newNote as Note, ...prev]);
    toast.success(t('toasts.noteCreated'));
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
      toast.error(t('toasts.errorCreating'));
      return null;
    }

    setTasks(prev => [newTask as Task, ...prev]);
    toast.success(t('toasts.taskCreated'));
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
      toast.error(t('toasts.errorUpdating'));
      return;
    }

    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));
  };

  // Update event
  const updateEvent = async (eventId: string, data: Partial<CalendarEvent>) => {
    const { error } = await supabase
      .from('calendar_events')
      .update(data)
      .eq('id', eventId);

    if (error) {
      toast.error(t('toasts.errorUpdating'));
      return;
    }

    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, ...data } : e
    ));
    toast.success(t('toasts.eventUpdated'));
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast.error(t('toasts.errorDeleting'));
      return;
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success(t('toasts.eventDeleted'));
  };

  // Update subject
  const updateSubject = async (subjectId: string, data: Partial<Subject>) => {
    const { error } = await supabase
      .from('subjects')
      .update(data)
      .eq('id', subjectId);

    if (error) {
      toast.error(t('toasts.errorUpdating'));
      return;
    }

    setSubjects(prev => prev.map(s => 
      s.id === subjectId ? { ...s, ...data } : s
    ));
    toast.success(t('toasts.subjectUpdated'));
  };

  // Delete subject
  const deleteSubject = async (subjectId: string) => {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId);

    if (error) {
      toast.error(t('toasts.errorDeleting'));
      return;
    }

    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    toast.success(t('toasts.subjectDeleted'));
  };

  // Update note
  const updateNote = async (noteId: string, data: Partial<Note>) => {
    const { error } = await supabase
      .from('notes_vault')
      .update(data)
      .eq('id', noteId);

    if (error) {
      toast.error(t('toasts.errorUpdating'));
      return;
    }

    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, ...data } : n
    ));
    toast.success(t('toasts.noteUpdated'));
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('notes_vault')
      .delete()
      .eq('id', noteId);

    if (error) {
      toast.error(t('toasts.errorDeleting'));
      return;
    }

    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success(t('toasts.noteDeleted'));
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error(t('toasts.errorDeleting'));
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success(t('toasts.taskDeleted'));
  };

  // Get current class based on time
  const getCurrentClass = (): CalendarEvent | null => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    const todayStr = toLocalDateStr(now);

    const todayClasses = filteredEvents.filter(e => {
      if (e.event_type !== 'class') return false;
      if (e.event_date) return e.event_date === todayStr;
      return e.day_of_week === now.getDay();
    });

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
    const todayStr = toLocalDateStr(now);

    const todayClasses = filteredEvents
      .filter(e => {
        if (e.event_type !== 'class') return false;
        if (e.event_date) return e.event_date === todayStr;
        return e.day_of_week === now.getDay();
      })
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

    // Return first class of tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toLocalDateStr(tomorrow);
    const tomorrowClasses = filteredEvents.filter(e => {
      if (e.event_type !== 'class') return false;
      if (e.event_date) return e.event_date === tomorrowStr;
      return e.day_of_week === tomorrow.getDay();
    });
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
    return filteredEvents
      .filter(e => e.event_type === 'exam' && e.exam_date && new Date(e.exam_date) >= today)
      .sort((a, b) => new Date(a.exam_date ?? '').getTime() - new Date(b.exam_date ?? '').getTime());
  };

  // Get today's events (classes and exams)
  const getTodayEvents = (): CalendarEvent[] => {
    const today = new Date();
    const todayStr = toLocalDateStr(today);
    
    return filteredEvents
      .filter(e => {
        if (e.event_date) return e.event_date === todayStr;
        return e.day_of_week === today.getDay();
      })
      .sort((a, b) => {
        const [aH, aM] = a.start_time.split(':').map(Number);
        const [bH, bM] = b.start_time.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
      });
  };

  return {
    subjects,
    events: filteredEvents,
    allEvents: events, // unfiltered, for cases that need it
    notes,
    tasks,
    loading,
    userGroup,
    createSubject,
    createEvent,
    createNote,
    createTask,
    toggleTask,
    updateEvent,
    deleteEvent,
    updateSubject,
    deleteSubject,
    updateNote,
    deleteNote,
    deleteTask,
    getCurrentClass,
    getNextClass,
    getSubjectById,
    getHighestPriorityTask,
    getNotesBySubject,
    getUpcomingExams,
    getTodayEvents,
    refetch: fetchData,
  };
};
