import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { FileText, ChevronRight, Camera, PenLine, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { VaultFile } from "@/hooks/useVaultData";
import { useHaptics } from "@/hooks/useHaptics";

interface VaultFileCardProps {
  file: VaultFile;
  onClick?: () => void;
}

export const VaultFileCard = ({ file, onClick }: VaultFileCardProps) => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const formattedDate = format(new Date(file.created_at), "d MMM", { locale: fr });

  const handleClick = () => {
    haptics.selection();
    if (onClick) {
      onClick();
    } else {
      navigate(`/study/${file.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200",
        "bg-card border border-border",
        "hover:shadow-soft hover:border-primary/20",
        "text-left group"
      )}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
        {file.file_url ? (
          <img
            src={file.file_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-1">
          {file.ai_summary || "Document"}
        </p>
        {file.extracted_text && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {file.extracted_text.substring(0, 80)}
          </p>
        )}
      </div>

      {/* Date */}
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formattedDate}
      </span>

      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </button>
  );
};
