import { Task, Subject } from "@/hooks/useOrbitData";
import { cn } from "@/lib/utils";
import { Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { SubjectDot } from "./SubjectBadge";
import { useState } from "react";
import { Button } from "./ui/button";
import { useHaptics } from "@/hooks/useHaptics";

interface TaskItemProps {
  task: Task;
  subject?: Subject;
  onToggle: (taskId: string) => void;
  onDecompose?: (taskId: string) => void;
  subtasks?: Task[];
}

const energyColors = {
  low: "border-l-success",
  medium: "border-l-warning",
  high: "border-l-destructive",
};

const energyLabels = {
  low: "🌙 Zen",
  medium: "☀️ Moyen",
  high: "⚡ Max",
};

export const TaskItem = ({ task, subject, onToggle, onDecompose, subtasks = [] }: TaskItemProps) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const haptics = useHaptics();
  
  const handleToggle = (taskId: string) => {
    haptics.success();
    onToggle(taskId);
  };

  const getDaysUntil = (dateStr: string): number => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysUntil = task.due_date ? getDaysUntil(task.due_date) : null;
  const isOverdue = daysUntil !== null && daysUntil < 0;

  return (
    <div className="animate-fade-in">
      <div 
        className={cn(
          "bg-white/70 backdrop-blur-lg rounded-xl border border-white/30 shadow-soft",
        "p-4 border-l-4 transition-all duration-200",
        energyColors[task.energy_level],
        task.status === 'done' && "opacity-60",
        isOverdue && task.status !== 'done' && "ring-1 ring-destructive/30"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => handleToggle(task.id)}
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
              task.status === 'done' 
                ? "bg-success border-success" 
                : "border-muted-foreground/30 hover:border-primary"
            )}
          >
            {task.status === 'done' && (
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-foreground",
              task.status === 'done' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>
            
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {subject && (
                <div className="flex items-center gap-1.5">
                  <SubjectDot subject={{
                    id: subject.id,
                    name: subject.name,
                    colorKey: subject.color_key as any,
                    teacher: '',
                    icon: subject.icon
                  }} />
                  <span className="text-xs text-muted-foreground">{subject.name}</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {energyLabels[task.energy_level]}
              </span>
              {daysUntil !== null && (
                <span className={cn(
                  "text-xs font-medium",
                  isOverdue ? "text-destructive" :
                  daysUntil <= 1 ? "text-warning" :
                  "text-muted-foreground"
                )}>
                  {isOverdue ? 'Overdue' :
                   daysUntil === 0 ? 'Due today' :
                   daysUntil === 1 ? 'Tomorrow' :
                   `${daysUntil} days`}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!task.is_subtask && onDecompose && task.status !== 'done' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDecompose(task.id)}
                className="text-muted-foreground hover:text-primary"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
            {subtasks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-muted-foreground"
              >
                {showSubtasks ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Subtasks */}
      {showSubtasks && subtasks.length > 0 && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-dashed border-muted pl-4">
          {subtasks.map(subtask => (
            <TaskItem 
              key={subtask.id} 
              task={subtask} 
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
