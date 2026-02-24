import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrbitData } from "@/hooks/useOrbitData";
import { TaskItem } from "@/components/TaskItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Zap, Sun, Moon, Sparkles, Plus, GraduationCap, ArrowUpDown } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { TimelineWidget } from "@/components/timeline";

type EnergyFilter = 'all' | 'high' | 'medium' | 'low';
type SortMode = 'priority' | 'exam';

export const TasksPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tasks, subjects, toggleTask, getSubjectById, getUpcomingExams, createTask, refetch } = useOrbitData();
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTasks = tasks.filter(t => 
    !t.is_subtask && 
    (energyFilter === 'all' || t.energy_level === energyFilter)
  );

  const upcomingExams = getUpcomingExams();

  // Sort by exam proximity: tasks linked to subjects with upcoming exams come first
  const sortByExamProximity = (taskList: typeof filteredTasks) => {
    const examSubjectDates = new Map<string, number>();
    upcomingExams.forEach(exam => {
      if (exam.subject_id && exam.exam_date) {
        const existing = examSubjectDates.get(exam.subject_id);
        const examTime = new Date(exam.exam_date).getTime();
        if (!existing || examTime < existing) {
          examSubjectDates.set(exam.subject_id, examTime);
        }
      }
    });

    return [...taskList].sort((a, b) => {
      const aExam = a.subject_id ? examSubjectDates.get(a.subject_id) : undefined;
      const bExam = b.subject_id ? examSubjectDates.get(b.subject_id) : undefined;
      if (aExam && !bExam) return -1;
      if (!aExam && bExam) return 1;
      if (aExam && bExam) return aExam - bExam;
      return b.priority_score - a.priority_score;
    });
  };

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const sortedTodoTasks = sortMode === 'exam'
    ? sortByExamProximity(todoTasks)
    : todoTasks.sort((a, b) => b.priority_score - a.priority_score);

  const getSubtasks = (parentId: string) => 
    tasks.filter(t => t.parent_task_id === parentId);

  const handleDecompose = async (taskId: string) => {
    if (!user) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (tasks.some(t => t.parent_task_id === taskId)) {
      toast.info("Tâche déjà décomposée");
      return;
    }

    toast.loading("🧠 L'IA décompose ta tâche...", { id: "decompose" });

    try {
      const { data, error } = await supabase.functions.invoke("process-note", {
        body: { imageBase64: task.title, action: "decompose" },
      });

      if (error) throw error;

      const subtasks = data.subtasks || [];
      
      if (subtasks.length === 0) {
        toast.dismiss("decompose");
        toast.info("Impossible de décomposer cette tâche");
        return;
      }

      const subtaskPromises = subtasks.map(async (st: any, index: number) => {
        const dueDate = task.due_date 
          ? new Date(new Date(task.due_date).getTime() - (subtasks.length - index) * 12 * 60 * 60 * 1000)
          : null;

        return supabase.from("tasks").insert({
          user_id: user.id,
          title: st.title,
          priority_score: task.priority_score - (index * 5),
          energy_level: st.energyLevel || "medium",
          due_date: dueDate?.toISOString(),
          parent_task_id: taskId,
          is_subtask: true,
          subject_id: task.subject_id,
        });
      });

      await Promise.all(subtaskPromises);
      
      toast.dismiss("decompose");
      toast.success(`✨ Tâche décomposée en ${subtasks.length} étapes`);
      refetch();
    } catch (error: any) {
      console.error("Decompose error:", error);
      toast.dismiss("decompose");
      toast.error("Échec de la décomposition");
    }
  };

  const handleAddTask = async (data: {
    title: string;
    energy_level: 'low' | 'medium' | 'high';
    due_date?: string;
    subject_id?: string;
    priority_score: number;
  }) => {
    await createTask({
      title: data.title,
      energy_level: data.energy_level,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
      subject_id: data.subject_id,
      priority_score: data.priority_score,
    });
  };

  const energyFilters = [
    { id: 'all' as const, label: t('tasks.all'), icon: null },
    { id: 'high' as const, label: 'Max', icon: Zap },
    { id: 'medium' as const, label: 'Moyen', icon: Sun },
    { id: 'low' as const, label: 'Zen', icon: Moon },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">
            {t('tasks.pageTitle')}
          </h1>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="rounded-xl gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {t('tasks.addTask')}
        </Button>
      </div>

      {/* Energy Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {energyFilters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setEnergyFilter(id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${energyFilter === id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-white/60 text-muted-foreground hover:bg-white/80'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        ))}

        {/* Sort toggle */}
        <button
          onClick={() => setSortMode(prev => prev === 'priority' ? 'exam' : 'priority')}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ml-auto
            ${sortMode === 'exam'
              ? 'bg-warning/20 text-warning border border-warning/30'
              : 'bg-white/60 text-muted-foreground hover:bg-white/80'
            }
          `}
        >
          <GraduationCap className="w-4 h-4" />
          {t('tasks.examPriority')}
        </button>
      </div>

      {/* Timeline Widget */}
      <TimelineWidget />

      {/* AI Suggestion Card */}
      <GlassCard variant="subtle" className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {todoTasks.length > 0 
                ? `${todoTasks.length} ${t('tasks.waitingForYou')}`
                : t('tasks.allDone')
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {t('tasks.breakdownHint')}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Tasks */}
      <Tabs defaultValue="todo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-white/60 backdrop-blur-lg">
          <TabsTrigger value="todo" className="data-[state=active]:bg-white">
            {t('tasks.pending')} ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="data-[state=active]:bg-white">
            {t('tasks.completed')} ({doneTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="space-y-3">
          {sortedTodoTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('tasks.allDone')} 🎉</p>
            </div>
          ) : (
            sortedTodoTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                subject={task.subject_id ? getSubjectById(task.subject_id) : undefined}
                onToggle={toggleTask}
                onDecompose={handleDecompose}
                subtasks={getSubtasks(task.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="done" className="space-y-3">
          {doneTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('tasks.noDoneTasks')}</p>
            </div>
          ) : (
            doneTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                subject={task.subject_id ? getSubjectById(task.subject_id) : undefined}
                onToggle={toggleTask}
                subtasks={getSubtasks(task.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
        subjects={subjects}
      />
    </div>
  );
};
