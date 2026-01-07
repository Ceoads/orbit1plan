import { Subject, getNotesBySubject } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SubjectFolderProps {
  subject: Subject;
  onClick: () => void;
}

const colorStyles: Record<Subject['colorKey'], { bg: string; border: string }> = {
  math: { bg: "bg-math/10", border: "border-math/20" },
  history: { bg: "bg-warning/10", border: "border-warning/20" },
  physics: { bg: "bg-success/10", border: "border-success/20" },
  english: { bg: "bg-english/10", border: "border-english/20" },
  chemistry: { bg: "bg-destructive/10", border: "border-destructive/20" },
};

export const SubjectFolder = ({ subject, onClick }: SubjectFolderProps) => {
  const notes = getNotesBySubject(subject.id);
  const styles = colorStyles[subject.colorKey];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border-2 transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        "flex items-center gap-4",
        styles.bg,
        styles.border
      )}
    >
      <div className="text-3xl">{subject.icon}</div>
      <div className="flex-1 text-left">
        <h3 className="font-display font-semibold text-foreground">{subject.name}</h3>
        <p className="text-sm text-muted-foreground">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
};
