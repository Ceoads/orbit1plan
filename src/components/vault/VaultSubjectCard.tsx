import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Subject, VaultFile } from "@/hooks/useVaultData";

interface VaultSubjectCardProps {
  subject: Subject;
  fileCount: number;
  recentFiles: VaultFile[];
  onClick: () => void;
  newCount?: number;
}

const colorStyles: Record<string, { bg: string; border: string; accent: string }> = {
  math: { bg: "bg-primary/10", border: "border-primary/20", accent: "bg-primary" },
  history: { bg: "bg-warning/10", border: "border-warning/20", accent: "bg-warning" },
  physics: { bg: "bg-success/10", border: "border-success/20", accent: "bg-success" },
  english: { bg: "bg-[hsl(280,67%,55%)]/10", border: "border-[hsl(280,67%,55%)]/20", accent: "bg-[hsl(280,67%,55%)]" },
  chemistry: { bg: "bg-destructive/10", border: "border-destructive/20", accent: "bg-destructive" },
};

export const VaultSubjectCard = ({
  subject,
  fileCount,
  onClick,
  newCount = 0,
}: VaultSubjectCardProps) => {
  const styles = colorStyles[subject.color_key] || colorStyles.math;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border-2 transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        "text-left",
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl leading-none">{subject.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate">{subject.name}</h3>
          <p className="text-sm text-muted-foreground">
            {fileCount} {fileCount === 1 ? 'fichier' : 'fichiers'}
            {newCount > 0 && (
              <span className="text-primary font-medium"> • {newCount} nouveau{newCount > 1 ? 'x' : ''}</span>
            )}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};

