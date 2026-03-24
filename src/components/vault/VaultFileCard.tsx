import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { VaultFile } from "@/hooks/useVaultData";

interface VaultFileCardProps {
  file: VaultFile;
  onClick?: () => void;
}

export const VaultFileCard = ({ file, onClick }: VaultFileCardProps) => {
  const navigate = useNavigate();
  const formattedDate = format(new Date(file.created_at), "d MMM", { locale: fr });

  const handleClick = () => {
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
        "w-full flex items-center gap-4 px-4 py-3.5 rounded-lg transition-colors",
        "border border-[#1E1E24] hover:border-neutral-700 hover:bg-neutral-900/50",
        "text-left group"
      )}
    >
      {/* Thumbnail or icon */}
      <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-900 flex-shrink-0 flex items-center justify-center border border-[#1E1E24]">
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
          <FileText className="w-4 h-4 text-neutral-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-200 line-clamp-1">
          {file.ai_summary || "Document"}
        </p>
        {file.extracted_text && (
          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
            {file.extracted_text.substring(0, 80)}
          </p>
        )}
      </div>

      {/* Date */}
      <span className="text-[11px] text-neutral-600 flex-shrink-0">
        {formattedDate}
      </span>

      <ChevronRight className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
    </button>
  );
};
