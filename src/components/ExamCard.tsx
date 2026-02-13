import { GlassCard } from "./GlassCard";
import { Calendar, FileText } from "lucide-react";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

interface ExamCardProps {
  exam: {
    id: string;
    title: string;
    exam_date: string | null;
    subjectName: string;
    subjectIcon: string;
    subjectColorKey: 'math' | 'history' | 'physics' | 'english' | 'chemistry';
    notesCount: number;
    daysUntil: number;
  };
}

const colorClasses: Record<string, string> = {
  math: "bg-math/10 text-math border-math/20",
  history: "bg-warning/10 text-warning border-warning/20",
  physics: "bg-success/10 text-success border-success/20",
  english: "bg-english/10 text-english border-english/20",
  chemistry: "bg-destructive/10 text-destructive border-destructive/20",
};

export const ExamCard = ({ exam }: ExamCardProps) => {
  const urgencyLevel = exam.daysUntil <= 2 ? 'urgent' : exam.daysUntil <= 5 ? 'soon' : 'normal';
  
  // Calculate readiness (simple heuristic: more notes = more prepared)
  const readinessScore = Math.min(100, exam.notesCount * 25);

  return (
    <GlassCard className="p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <span 
          className={cn(
            "inline-flex items-center gap-1.5 font-medium rounded-full border px-3 py-1 text-sm",
            colorClasses[exam.subjectColorKey] || colorClasses.math
          )}
        >
          <span>{exam.subjectIcon}</span>
          {exam.subjectName}
        </span>
        <div className={cn(
          "px-3 py-1 rounded-full text-sm font-medium",
          urgencyLevel === 'urgent' ? "bg-destructive/10 text-destructive" :
          urgencyLevel === 'soon' ? "bg-warning/10 text-warning" :
          "bg-muted text-muted-foreground"
        )}>
          {exam.daysUntil === 0 ? "Aujourd'hui !" :
           exam.daysUntil === 1 ? 'Demain' :
           `${exam.daysUntil} jours`}
        </div>
      </div>

      <h3 className="font-display text-lg font-bold text-foreground mb-2">
        {exam.title}
      </h3>

      {exam.exam_date && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Calendar className="w-4 h-4" />
          <span>
          {new Date(exam.exam_date).toLocaleDateString('fr-FR', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
      )}

      {/* Readiness Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="w-4 h-4" />
            Préparation
          </span>
          <span className={cn(
            "font-medium",
            readinessScore >= 70 ? "text-success" :
            readinessScore >= 40 ? "text-warning" :
            "text-destructive"
          )}>
            {readinessScore}%
          </span>
        </div>
        <Progress 
          value={readinessScore} 
          className={cn(
            "h-2",
            readinessScore >= 70 ? "[&>div]:bg-success" :
            readinessScore >= 40 ? "[&>div]:bg-warning" :
            "[&>div]:bg-destructive"
          )}
        />
        <p className="text-xs text-muted-foreground">
          {exam.notesCount} notes capturées
        </p>
      </div>
    </GlassCard>
  );
};
