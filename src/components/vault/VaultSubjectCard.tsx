import { cn } from "@/lib/utils";
import { Subject, VaultFile } from "@/hooks/useVaultData";

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
  recentFiles,
  onClick,
  newCount = 0,
}: VaultSubjectCardProps) => {
  const mostRecent = recentFiles[0];
  const hasThumb = !!mostRecent?.thumbnail_url || !!mostRecent?.file_url;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group w-full"
    >
      {/* Notebook cover */}
      <div className={cn(
        "relative w-full aspect-[3/4] rounded-xl overflow-hidden",
        "shadow-lg transition-all duration-200",
        "group-hover:scale-[1.03] group-active:scale-[0.97]",
        "bg-gradient-to-br from-muted/80 to-muted border border-border/40"
      )}>
        {/* Spine accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 rounded-l-xl z-10" />

        {/* Content area */}
        {hasThumb ? (
          <img
            src={mostRecent.thumbnail_url || mostRecent.file_url}
            alt={subject.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const fallback = (e.target as HTMLImageElement).nextElementSibling;
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}

        {/* Solid color fallback when no thumbnail */}
        {!hasThumb && (
          <div className="absolute inset-0 bg-primary/15" />
        )}

        {/* New badge */}
        {newCount > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-md">
              {newCount}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="text-center w-full px-1">
        <p className="text-xs font-medium text-foreground truncate leading-tight">
          {subject.name}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {fileCount} {fileCount === 1 ? 'fichier' : 'fichiers'}
        </p>
      </div>
    </button>
  );
};
