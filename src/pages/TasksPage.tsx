import { useState } from "react";
import { useOrbitData } from "@/hooks/useOrbitData";
import { TaskItem } from "@/components/TaskItem";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Zap, Sun, Moon, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type EnergyFilter = 'all' | 'high' | 'medium' | 'low';

export const TasksPage = () => {
  const { user } = useAuth();
  const { tasks, subjects, toggleTask, updateTaskPriority, deleteTask, getSubjectById, createTask, refetch } = useOrbitData();
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTasks = tasks.filter(t => 
    !t.is_subtask && 
    (energyFilter === 'all' || t.energy_level === energyFilter)
  );

  const todoTasks = filteredTasks
    .filter(t => t.status === 'todo')
    .sort((a, b) => b.priority_score - a.priority_score);
    
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const getSubtasks = (parentId: string) => 
    tasks.filter(t => t.parent_task_id === parentId);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = todoTasks.findIndex(t => t.id === active.id);
      const newIndex = todoTasks.findIndex(t => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Calculate new priority based on position
        // Higher index = lower in list = lower priority
        const maxPriority = 100;
        const step = maxPriority / (todoTasks.length + 1);
        const newPriority = Math.round(maxPriority - (newIndex * step));

        await updateTaskPriority(active.id as string, newPriority);
        refetch();
      }
    }
  };

  const handleDecompose = async (taskId: string) => {
    if (!user) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if already has subtasks
    if (tasks.some(t => t.parent_task_id === taskId)) {
      toast.info("Task already decomposed");
      return;
    }

    toast.loading("🧠 AI breaking down your task...", { id: "decompose" });

    try {
      const { data, error } = await supabase.functions.invoke("process-note", {
        body: { imageBase64: task.title, action: "decompose" },
      });

      if (error) throw error;

      const subtasks = data.subtasks || [];
      
      if (subtasks.length === 0) {
        toast.dismiss("decompose");
        toast.info("Couldn't break down this task");
        return;
      }

      // Create subtasks in database
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
      toast.success(`✨ Task broken down into ${subtasks.length} steps`);
      refetch();
    } catch (error: any) {
      console.error("Decompose error:", error);
      toast.dismiss("decompose");
      toast.error("Failed to decompose task");
    }
  };

  const handleCreateTask = async (data: {
    title: string;
    energy_level: 'low' | 'medium' | 'high';
    due_date: string | null;
    subject_id: string | null;
    priority_score: number;
  }) => {
    const result = await createTask(data);
    if (result) {
      toast.success("Task created!");
    }
    return result;
  };

  const energyFilters = [
    { id: 'all' as const, label: 'All', icon: null },
    { id: 'high' as const, label: 'High', icon: Zap },
    { id: 'medium' as const, label: 'Med', icon: Sun },
    { id: 'low' as const, label: 'Low', icon: Moon },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">
            To-Do Engine
          </h1>
        </div>
        <CreateTaskDialog subjects={subjects} onCreateTask={handleCreateTask} />
      </div>

      {/* Energy Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {energyFilters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setEnergyFilter(id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${energyFilter === id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-white/60 text-muted-foreground hover:bg-white/80'
              }
            `}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* AI Suggestion Card */}
      <GlassCard variant="subtle" className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {todoTasks.length > 0 
                ? `${todoTasks.length} tasks • Drag to reorder`
                : "All caught up! 🎉"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Tap ✨ to break big tasks into steps
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Tasks */}
      <Tabs defaultValue="todo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-white/60 backdrop-blur-lg">
          <TabsTrigger value="todo" className="data-[state=active]:bg-white">
            To Do ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="data-[state=active]:bg-white">
            Done ({doneTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="space-y-3">
          {todoTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">All tasks completed! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a new task to get started
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={todoTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {todoTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    subject={task.subject_id ? getSubjectById(task.subject_id) : undefined}
                    onToggle={toggleTask}
                    onDecompose={handleDecompose}
                    onDelete={deleteTask}
                    subtasks={getSubtasks(task.id)}
                    isDraggable={true}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        <TabsContent value="done" className="space-y-3">
          {doneTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Complete some tasks to see them here</p>
            </div>
          ) : (
            doneTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                subject={task.subject_id ? getSubjectById(task.subject_id) : undefined}
                onToggle={toggleTask}
                onDelete={deleteTask}
                subtasks={getSubtasks(task.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};