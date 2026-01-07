import { cn } from "@/lib/utils";
import { Subject } from "@/lib/mockData";

interface SubjectBadgeProps {
  subject: Subject;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const colorClasses: Record<Subject['colorKey'], string> = {
  math: "bg-math/10 text-math border-math/20",
  history: "bg-warning/10 text-warning border-warning/20",
  physics: "bg-success/10 text-success border-success/20",
  english: "bg-english/10 text-english border-english/20",
  chemistry: "bg-destructive/10 text-destructive border-destructive/20",
};

const solidColorClasses: Record<Subject['colorKey'], string> = {
  math: "bg-math text-white",
  history: "bg-warning text-white",
  physics: "bg-success text-white",
  english: "bg-english text-white",
  chemistry: "bg-destructive text-white",
};

export const SubjectBadge = ({ subject, size = 'md', showIcon = true }: SubjectBadgeProps) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        colorClasses[subject.colorKey],
        sizeClasses[size]
      )}
    >
      {showIcon && <span>{subject.icon}</span>}
      {subject.name}
    </span>
  );
};

export const SubjectDot = ({ subject }: { subject: Subject }) => {
  return (
    <span 
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full",
        solidColorClasses[subject.colorKey]
      )}
    />
  );
};
