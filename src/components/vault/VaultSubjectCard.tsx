import { cn } from "@/lib/utils";
import { Subject, VaultFile } from "@/hooks/useVaultData";
import { ChevronRight } from "lucide-react";

interface VaultSubjectCardProps {
  subject: Subject;
  fileCount: number;
  recentFiles: VaultFile[];
  onClick: () => void;
  newCount?: number;
}

export const VaultSubjectCard = ({
  subject,
  fileCount,
  onClick,
  newCount = 0,
}: VaultSubjectCardProps) => {
  const isSAE = subject.icon === "SAE";
  const borderColor = isSAE ? "#6366F1" : (subject.color_key || "#3B82F6");

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-colors",
        "border border-[#1E1E24] hover:border-neutral-700 hover:bg-neutral-900/50",
        "text-left group"
      )}
    >
      {/* Color accent bar */}
      <div
        className="w-1 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: borderColor }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-200 truncate">
          {subject.name}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {fileCount} {fileCount === 1 ? "fichier" : "fichiers"}
        </p>
      </div>

      {/* New badge */}
      {newCount > 0 && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 text-neutral-900 text-[10px] font-bold">
          {newCount}
        </span>
      )}

      {/* Category label */}
      <span className="text-[10px] uppercase tracking-wider text-neutral-600 flex-shrink-0">
        {isSAE ? "SAE" : ""}
      </span>

      <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
    </button>
  );
};
