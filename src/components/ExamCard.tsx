import { Exam, getSubjectById, getDaysUntil, mockNotes } from "@/lib/mockData";
import { GlassCard } from "./GlassCard";
import { SubjectBadge } from "./SubjectBadge";
import { cn } from "@/lib/utils";
import { Calendar, FileText } from "lucide-react";
import { Progress } from "./ui/progress";

interface ExamCardProps {
  exam: Exam;
}

export const ExamCard = ({ exam }: ExamCardProps) => {
  const subject = getSubjectById(exam.subjectId);
  const daysUntil = getDaysUntil(exam.date);
  
  // Calculate readiness based on linked notes (mock logic)
  const totalNotesForSubject = mockNotes.filter(n => n.subjectId === exam.subjectId).length;
  const linkedNotesCount = exam.linkedNotes.length;
  const readinessScore = totalNotesForSubject > 0 
    ? Math.round((linkedNotesCount / Math.max(totalNotesForSubject, 3)) * 100)
    : 0;

  const urgencyLevel = daysUntil <= 2 ? 'urgent' : daysUntil <= 5 ? 'soon' : 'normal';

  if (!subject) return null;

  return (
    <GlassCard className="p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <SubjectBadge subject={subject} size="sm" />
        <div className={cn(
          "px-3 py-1 rounded-full text-sm font-medium",
          urgencyLevel === 'urgent' ? "bg-destructive/10 text-destructive" :
          urgencyLevel === 'soon' ? "bg-warning/10 text-warning" :
          "bg-muted text-muted-foreground"
        )}>
          {daysUntil === 0 ? 'Today!' :
           daysUntil === 1 ? 'Tomorrow' :
           `${daysUntil} days`}
        </div>
      </div>

      <h3 className="font-display text-lg font-bold text-foreground mb-2">
        {exam.title}
      </h3>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Calendar className="w-4 h-4" />
        <span>
          {exam.date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* Readiness Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="w-4 h-4" />
            Readiness
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
          {linkedNotesCount} notes linked • {totalNotesForSubject} total for subject
        </p>
      </div>
    </GlassCard>
  );
};
