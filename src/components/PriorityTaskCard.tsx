import { GlassCard } from "./GlassCard";
import { getHighestPriorityTask, getSubjectById, getDaysUntil } from "@/lib/mockData";
import { SubjectDot } from "./SubjectBadge";
import { Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface PriorityTaskCardProps {
  onTaskComplete?: (taskId: string) => void;
}

export const PriorityTaskCard = ({ onTaskComplete }: PriorityTaskCardProps) => {
  const task = getHighestPriorityTask();
  const subject = task?.subjectId ? getSubjectById(task.subjectId) : null;
  
  if (!task) {
    return (
      <GlassCard className="p-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">All caught up!</p>
            <p className="font-display font-semibold text-foreground">No pending tasks</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const daysUntil = getDaysUntil(task.dueDate);
  const urgencyLevel = daysUntil <= 1 ? 'urgent' : daysUntil <= 3 ? 'soon' : 'normal';
  
  const urgencyStyles = {
    urgent: "border-l-destructive",
    soon: "border-l-warning",
    normal: "border-l-primary",
  };

  const energyIcons = {
    low: "🌙",
    medium: "☀️",
    high: "⚡",
  };

  return (
    <GlassCard 
      className={cn(
        "p-5 animate-fade-in border-l-4",
        urgencyStyles[urgencyLevel]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium text-muted-foreground">
            Priority Task
          </span>
        </div>
        <span className="text-lg">{energyIcons[task.energyLevel]}</span>
      </div>
      
      <h3 className="font-display text-lg font-bold text-foreground mb-2">
        {task.title}
      </h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {subject && (
            <div className="flex items-center gap-1.5">
              <SubjectDot subject={subject} />
              <span className="text-sm text-muted-foreground">{subject.name}</span>
            </div>
          )}
          <span className={cn(
            "text-sm font-medium",
            urgencyLevel === 'urgent' ? "text-destructive" :
            urgencyLevel === 'soon' ? "text-warning" :
            "text-muted-foreground"
          )}>
            {daysUntil === 0 ? 'Due today' :
             daysUntil === 1 ? 'Due tomorrow' :
             `${daysUntil} days left`}
          </span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => onTaskComplete?.(task.id)}
        >
          Start <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </GlassCard>
  );
};
