import { GlassCard } from "./GlassCard";
import { SubjectBadge, SubjectDot } from "./SubjectBadge";
import { getCurrentClass, getNextClass, getSubjectById } from "@/lib/mockData";
import { Clock, BookOpen } from "lucide-react";

export const CurrentClassCard = () => {
  const currentClass = getCurrentClass();
  const nextClass = getNextClass();
  
  const displayClass = currentClass || nextClass;
  const subject = displayClass ? getSubjectById(displayClass.subjectId) : null;
  const isCurrentlyInClass = !!currentClass;

  if (!displayClass || !subject) {
    return (
      <GlassCard className="p-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">No classes today</p>
            <p className="font-display font-semibold text-foreground">Enjoy your free time!</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 animate-fade-in overflow-hidden relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div 
          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${
            subject.colorKey === 'math' ? 'bg-math' :
            subject.colorKey === 'physics' ? 'bg-success' :
            subject.colorKey === 'history' ? 'bg-warning' :
            subject.colorKey === 'english' ? 'bg-english' :
            'bg-destructive'
          }`}
        />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <SubjectDot subject={subject} />
            <span className="text-sm font-medium text-muted-foreground">
              {isCurrentlyInClass ? 'Currently in' : 'Up next'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{displayClass.startTime} - {displayClass.endTime}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-3xl">{subject.icon}</div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {subject.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              with {subject.teacher}
            </p>
          </div>
        </div>
        
        {isCurrentlyInClass && (
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-success">Class in progress</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
