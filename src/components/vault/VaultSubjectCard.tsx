import { ChevronRight, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Subject, VaultFile } from "@/hooks/useVaultData";

interface VaultSubjectCardProps {
  subject: Subject;
  fileCount: number;
  recentFiles: VaultFile[];
  onClick: () => void;
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
  recentFiles,
  onClick,
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="text-3xl">{subject.icon}</div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground">{subject.name}</h3>
          <p className="text-sm text-muted-foreground">
            {fileCount} {fileCount === 1 ? 'fichier' : 'fichiers'}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Recent files preview */}
      {recentFiles.length > 0 && (
        <div className="mt-3 flex gap-2">
          {recentFiles.map(file => (
            <div
              key={file.id}
              className="w-16 h-16 rounded-lg overflow-hidden bg-background/50 border border-border/50"
            >
              {file.file_url ? (
                <img
                  src={file.file_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {fileCount > 3 && (
            <div className="w-16 h-16 rounded-lg bg-background/50 border border-border/50 flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                +{fileCount - 3}
              </span>
            </div>
          )}
        </div>
      )}
    </button>
  );
};
