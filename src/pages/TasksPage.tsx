import { useState } from "react";
import { mockTasks, Task } from "@/lib/mockData";
import { TaskItem } from "@/components/TaskItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Zap, Sun, Moon, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { toast } from "sonner";

type EnergyFilter = 'all' | 'high' | 'medium' | 'low';

export const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>('all');

  const filteredTasks = tasks.filter(t => 
    !t.isSubtask && 
    (energyFilter === 'all' || t.energyLevel === energyFilter)
  );

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const getSubtasks = (parentId: string) => 
    tasks.filter(t => t.parentTaskId === parentId);

  const handleToggle = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
        : t
    ));
  };

  const handleDecompose = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if already has subtasks
    if (tasks.some(t => t.parentTaskId === taskId)) {
      toast.info("Task already decomposed");
      return;
    }

    // Generate 3 subtasks
    const subtasks: Task[] = [
      {
        id: `${taskId}-sub1`,
        title: `Review key concepts for ${task.title}`,
        status: 'todo',
        priorityScore: task.priorityScore - 5,
        energyLevel: 'low',
        dueDate: new Date(task.dueDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        parentTaskId: taskId,
        isSubtask: true,
        subjectId: task.subjectId,
      },
      {
        id: `${taskId}-sub2`,
        title: `Practice problems related to ${task.title}`,
        status: 'todo',
        priorityScore: task.priorityScore - 3,
        energyLevel: 'medium',
        dueDate: new Date(task.dueDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        parentTaskId: taskId,
        isSubtask: true,
        subjectId: task.subjectId,
      },
      {
        id: `${taskId}-sub3`,
        title: `Final review before ${task.title}`,
        status: 'todo',
        priorityScore: task.priorityScore,
        energyLevel: 'high',
        dueDate: task.dueDate,
        parentTaskId: taskId,
        isSubtask: true,
        subjectId: task.subjectId,
      },
    ];

    setTasks(prev => [...prev, ...subtasks]);
    toast.success("✨ Task broken down into 3 smaller steps");
  };

  const energyFilters = [
    { id: 'all' as const, label: 'All', icon: null },
    { id: 'high' as const, label: 'High', icon: Zap },
    { id: 'medium' as const, label: 'Medium', icon: Sun },
    { id: 'low' as const, label: 'Low', icon: Moon },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2">
        <CheckSquare className="w-5 h-5 text-primary" />
        <h1 className="font-display text-xl font-bold text-foreground">
          To-Do Engine
        </h1>
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
      </div>

      {/* AI Suggestion Card */}
      <GlassCard variant="subtle" className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Free period at 2pm detected
            </p>
            <p className="text-xs text-muted-foreground">
              Perfect time for "Review Physics Notes"
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
            </div>
          ) : (
            todoTasks
              .sort((a, b) => b.priorityScore - a.priorityScore)
              .map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDecompose={handleDecompose}
                  subtasks={getSubtasks(task.id)}
                />
              ))
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
                onToggle={handleToggle}
                subtasks={getSubtasks(task.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
