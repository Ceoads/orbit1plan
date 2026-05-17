import { cn } from "@/lib/utils";
import { Subject } from "@/hooks/useVaultData";
import { getCourseColor } from "@/lib/courseColors";
import { ChevronRight } from "lucide-react";

interface VaultFolderCardProps {
  subject: Subject;
  fileCount: number;
  onClick: () => void;
  variant?: "grid" | "list";
}

/**
 * 3D folder card — colored folder body with stacked papers peeking out the top.
 * Used in both the grid and list views of the Vault.
 */
export const VaultFolderCard = ({
  subject,
  fileCount,
  onClick,
  variant = "grid",
}: VaultFolderCardProps) => {
  const color = getCourseColor(subject.name);
  const hasFiles = fileCount > 0;

  if (variant === "list") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl",
          "bg-card border border-border transition-all duration-200",
          "hover:shadow-soft active:scale-[0.99] text-left group"
        )}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color.hex }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {subject.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fileCount} {fileCount === 1 ? "fichier" : "fichiers"}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-start gap-2 group text-left"
    >
      <div
        className={cn(
          "relative w-full aspect-[1/1.05] rounded-3xl overflow-hidden",
          "transition-all duration-200 active:scale-[0.97] group-hover:shadow-soft"
        )}
        style={{ background: "#F5F5F5" }}
      >
        {/* Status dot */}
        <span
          className="absolute top-3 left-3 w-2 h-2 rounded-full z-10"
          style={{ backgroundColor: hasFiles ? "#4CAF7D" : "#C7C7CC" }}
        />

        {/* 3D folder illustration */}
        <Folder3D color={color.hex} />
      </div>

      <div className="flex items-baseline gap-1.5 px-1 w-full">
        <span className="text-sm font-medium text-foreground truncate">
          {subject.name}
        </span>
        <span className="text-sm text-muted-foreground flex-shrink-0">
          {fileCount}
        </span>
      </div>
    </button>
  );
};

const Folder3D = ({ color }: { color: string }) => (
  <div className="absolute inset-0 flex items-end justify-center pb-6">
    <div className="relative w-[78%] aspect-[1.25/1]">
      {/* Papers peeking out the top */}
      <div
        className="absolute left-[14%] right-[18%] -top-3 h-[55%] rounded-md bg-white shadow-sm"
        style={{ transform: "rotate(-6deg)", zIndex: 1 }}
      />
      <div
        className="absolute left-[20%] right-[12%] -top-2 h-[55%] rounded-md bg-white shadow-sm"
        style={{ transform: "rotate(4deg)", zIndex: 2 }}
      />
      <div
        className="absolute left-[16%] right-[16%] -top-1 h-[55%] rounded-md bg-white shadow-sm"
        style={{ transform: "rotate(-1deg)", zIndex: 3 }}
      />

      {/* Folder tab (back) */}
      <div
        className="absolute top-0 left-0 h-[22%] w-[55%] rounded-t-xl"
        style={{
          background: color,
          filter: "brightness(0.92)",
          zIndex: 4,
        }}
      />
      {/* Folder body (front) */}
      <div
        className="absolute top-[16%] left-0 right-0 bottom-0 rounded-xl shadow-md"
        style={{
          background: `linear-gradient(180deg, ${color} 0%, ${color} 70%, rgba(0,0,0,0.08) 100%)`,
          boxShadow: `0 8px 18px -6px ${color}66, inset 0 -3px 0 rgba(0,0,0,0.06)`,
          zIndex: 5,
        }}
      />
      {/* Highlight */}
      <div
        className="absolute top-[18%] left-2 right-2 h-[6%] rounded-full opacity-30"
        style={{ background: "rgba(255,255,255,0.6)", zIndex: 6 }}
      />
    </div>
  </div>
);
