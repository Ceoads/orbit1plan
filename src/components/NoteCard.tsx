import { Note } from "@/hooks/useOrbitData";
import { GlassCard } from "./GlassCard";
import { Clock, FileText, Image } from "lucide-react";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
}

export const NoteCard = ({ note, onClick }: NoteCardProps) => {
  const hasImage = !!note.media_url;

  return (
    <GlassCard 
      variant="subtle" 
      className="p-4 hover:shadow-glass transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {hasImage ? (
            <img 
              src={note.media_url!} 
              alt="Note" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <FileText className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground line-clamp-2 mb-2">
            {note.ai_summary || note.raw_text?.substring(0, 100) || "Processing..."}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(note.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {hasImage && (
              <>
                <span className="mx-1">•</span>
                <Image className="w-3 h-3" />
                <span>Image</span>
              </>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
