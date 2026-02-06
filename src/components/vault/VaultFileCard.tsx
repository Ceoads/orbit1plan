import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { FileText, Tag, Sparkles, Image, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { VaultFile } from "@/hooks/useVaultData";
import { Badge } from "@/components/ui/badge";
import { useHaptics } from "@/hooks/useHaptics";

interface VaultFileCardProps {
  file: VaultFile;
  onClick?: () => void;
}

export const VaultFileCard = ({ file, onClick }: VaultFileCardProps) => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const formattedDate = format(new Date(file.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr });

  // Extract quiz score from tags if present
  const quizScoreTag = file.tags?.find(tag => tag.startsWith('quiz:'));
  const quizScore = quizScoreTag ? parseInt(quizScoreTag.replace('quiz:', '').replace('%', '')) : null;

  const handleClick = () => {
    haptics.selection();
    if (onClick) {
      onClick();
    } else {
      // Navigate to Study Hub
      navigate(`/study/${file.id}`);
    }
  };

  const statusColors = {
    pending: "bg-warning/10 text-warning border-warning/20",
    confirmed: "bg-success/10 text-success border-success/20",
    changed: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full p-4 rounded-2xl bg-card border border-border",
        "hover:shadow-soft hover:border-primary/20 transition-all duration-200",
        "text-left"
      )}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {file.file_url ? (
            <img
              src={file.file_url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Summary */}
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {file.ai_summary || 'Document capturé'}
            </p>
          </div>

          {/* Extracted text preview */}
          {file.extracted_text && (
            <div className="flex items-start gap-2 mt-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground line-clamp-2">
                {file.extracted_text.substring(0, 100)}...
              </p>
            </div>
          )}

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Tag className="w-3 h-3 text-muted-foreground" />
              {file.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {file.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{file.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
            <div className="flex items-center gap-2">
              {/* Quiz score badge */}
              {quizScore !== null && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    quizScore >= 80 ? "bg-success/10 text-success border-success/20" :
                    quizScore >= 50 ? "bg-warning/10 text-warning border-warning/20" :
                    "bg-destructive/10 text-destructive border-destructive/20"
                  )}
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  {quizScore}%
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={cn("text-xs", statusColors[file.filing_status as keyof typeof statusColors] || statusColors.pending)}
              >
                {file.filing_status === 'confirmed' ? '✓ Classé' : 
                 file.filing_status === 'changed' ? '↺ Modifié' : '⏳ En attente'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
