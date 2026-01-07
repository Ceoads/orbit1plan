import { Note, getSubjectById } from "@/lib/mockData";
import { GlassCard } from "./GlassCard";
import { SubjectDot } from "./SubjectBadge";
import { Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
}

export const NoteCard = ({ note, onClick }: NoteCardProps) => {
  const subject = getSubjectById(note.subjectId);

  return (
    <GlassCard 
      variant="subtle" 
      className="p-4 hover:shadow-glass transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          <FileText className="w-6 h-6 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {subject && (
              <>
                <SubjectDot subject={subject} />
                <span className="text-xs font-medium text-muted-foreground">
                  {subject.name}
                </span>
              </>
            )}
          </div>
          
          <p className="text-sm text-foreground line-clamp-2 mb-2">
            {note.aiSummary || note.rawText.substring(0, 100)}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {note.timestamp.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
