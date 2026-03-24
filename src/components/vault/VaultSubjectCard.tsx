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

const colorMap: Record<string, string> = {
  math: "hsl(var(--math))",
  history: "hsl(var(--history))",
  physics: "hsl(var(--physics))",
  english: "hsl(var(--english))",
  chemistry: "hsl(var(--chemistry))",
  geometry: "hsl(var(--geometry))",
};

export const VaultSubjectCard = ({
  subject,
  fileCount,
  onClick,
  newCount = 0,
}: VaultSubjectCardProps) => {
  const isSAE = subject.icon === "SAE";
  const accentColor = colorMap[subject.color_key] || "hsl(var(--primary))";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200",
        "bg-card border border-border",
        "hover:shadow-soft hover:scale-[1.01] active:scale-[0.99]",
        "text-left group"
      )}
    >
      {/* Color accent bar */}
      <div
        className="w-1 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: accentColor }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {subject.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {fileCount} {fileCount === 1 ? "fichier" : "fichiers"}
        </p>
      </div>

      {/* New badge */}
      {newCount > 0 && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
          {newCount}
        </span>
      )}

      {/* SAE label */}
      {isSAE && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex-shrink-0">
          SAE
        </span>
      )}

      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </button>
  );
};
