import { Task, Subject } from "@/hooks/useOrbitData";
import { cn } from "@/lib/utils";
import { Check, Sparkles, ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { SubjectDot } from "./SubjectBadge";
import { useState, forwardRef } from "react";
import { Button } from "./ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskItemProps {
  task: Task;
  subject?: Subject;
  onToggle: (taskId: string) => void;
  onDecompose?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  subtasks?: Task[];
  isDraggable?: boolean;
}

const energyColors = {
  low: "border-l-success",
  medium: "border-l-warning",
  high: "border-l-destructive",
};

const energyLabels = {
  low: "🌙 Low",
  medium: "☀️ Med",
  high: "⚡ High",
};

export const TaskItem = ({ 
  task, 
  subject, 
  onToggle, 
  onDecompose, 
  onDelete,
  subtasks = [],
  isDraggable = false 
}: TaskItemProps) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn("animate-fade-in", isDragging && "opacity-50")}
    >
      <div 
        className={cn(
          "bg-white/70 backdrop-blur-lg rounded-xl border border-white/30 shadow-soft",
          "p-4 border-l-4 transition-all duration-200",
          energyColors[task.energy_level],
          task.status === 'done' && "opacity-60"
        )}
      >
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          {isDraggable && task.status !== 'done' && (
            <button
              {...attributes}
              {...listeners}
              className="touch-none p-1 -ml-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          {/* Checkbox */}
          <button
            onClick={() => onToggle(task.id)}
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
              "font-medium text-foreground text-sm",
              task.status === 'done' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>
            
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {subject && (
                <div className="flex items-center gap-1">
                  <SubjectDot subject={{
                    id: subject.id,
                    name: subject.name,
                    colorKey: subject.color_key as any,
                    teacher: '',
                    icon: subject.icon
                  }} />
                  <span className="text-[10px] text-muted-foreground">{subject.name}</span>
                </div>
              )}
              <span className="text-[10px] text-muted-foreground">
                {energyLabels[task.energy_level]}
              </span>
              {daysUntil !== null && (
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  isOverdue ? "bg-destructive/10 text-destructive" :
                  daysUntil <= 1 ? "bg-warning/10 text-warning" :
                  "bg-muted text-muted-foreground"
                )}>
                  {isOverdue ? 'Overdue' :
                   daysUntil === 0 ? 'Today' :
                   daysUntil === 1 ? 'Tomorrow' :
                   `${daysUntil}d`}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            {!task.is_subtask && onDecompose && task.status !== 'done' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDecompose(task.id)}
                className="h-7 w-7 text-muted-foreground hover:text-primary"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </Button>
            )}
            {subtasks.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="h-7 w-7 text-muted-foreground"
              >
                {showSubtasks ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
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
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};