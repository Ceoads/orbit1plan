import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface TimelineTask {
  id: string;
  user_id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  scheduled_at: string;
  estimated_duration: number;
  priority: string;
  note: string | null;
  completed: boolean;
  created_at: string;
}

export interface CreateTimelineTask {
  title: string;
  category: string;
  icon: string;
  color: string;
  scheduled_at: string;
  estimated_duration: number;
  priority: string;
  note?: string;
}

const CATEGORY_DETECTION: Record<string, { category: string; icon: string; color: string }> = {
  'réviser|exam|cours|étud|devoir|lecture': { category: 'study', icon: '📚', color: '#9b87f5' },
  'sport|gym|yoga|course|footing|muscul|natation': { category: 'sport', icon: '💪', color: '#2dd4a0' },
  'courses|banque|rdv|médecin|docteur|coiffeur|ménage': { category: 'personal', icon: '🏦', color: '#ff9f6b' },
};

export const detectCategory = (title: string) => {
  const lower = title.toLowerCase();
  for (const [pattern, result] of Object.entries(CATEGORY_DETECTION)) {
    if (new RegExp(pattern).test(lower)) return result;
  }
  return { category: 'other', icon: '📝', color: '#5ba4f5' };
};

export const CATEGORY_COLORS: Record<string, string> = {
  study: '#9b87f5',
  sport: '#2dd4a0',
  personal: '#ff9f6b',
  other: '#5ba4f5',
};

export const useTimelineTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('timeline_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });
    
    if (!error && data) setTasks(data as TimelineTask[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (task: CreateTimelineTask) => {
    if (!user) return;
    const { error } = await supabase.from('timeline_tasks').insert({
      ...task,
      user_id: user.id,
      completed: false,
    });
    if (error) { toast.error("Erreur de création"); return; }
    toast.success("Tâche ajoutée ✨");
    fetchTasks();
  };

  const updateTask = async (id: string, updates: Partial<TimelineTask>) => {
    const { error } = await supabase.from('timeline_tasks').update(updates).eq('id', id);
    if (error) { toast.error("Erreur de mise à jour"); return; }
    fetchTasks();
  };

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateTask(id, { completed: !task.completed });
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('timeline_tasks').delete().eq('id', id);
    if (error) { toast.error("Erreur de suppression"); return; }
    toast.success("Tâche supprimée");
    fetchTasks();
  };

  const getWeekCount = (startOfWeek: Date, endOfWeek: Date) => {
    return tasks.filter(t => {
      const d = new Date(t.scheduled_at);
      return d >= startOfWeek && d <= endOfWeek;
    }).length;
  };

  return { tasks, loading, createTask, updateTask, toggleComplete, deleteTask, fetchTasks, getWeekCount };
};
