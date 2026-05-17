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
 * Premium 3D folder card.
 * - Gradient body (course color top → darker bottom)
 * - 3 stacked white paper sheets peeking from inside the folder
 * - Status dot top-left (green if has files, gray if empty)
 * - Course name + file count below the card
 */
export const VaultFolderCard = ({
  subject,
  fileCount,
  onClick,
  variant = "grid",
}: VaultFolderCardProps) => {
  const color = getCourseColor(subject.name);
  const top = color.hex;
  const bottom = shade(color.hex, -22);
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
          style={{ backgroundColor: top }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {subject.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fileCount} {fileCount === 1 ? "document" : "documents"}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-start gap-2.5 group text-left"
    >
      <div
        className="relative w-full rounded-[20px] overflow-visible transition-all duration-200 ease-out group-hover:scale-[1.04] group-active:scale-[0.97]"
        style={{
          aspectRatio: "160 / 180",
          filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.12))",
        }}
      >
        {/* Stacked papers (peeking from inside folder, behind the front flap) */}
        <Paper offsetTop="6%"  widthPct={84} rotate={-3} z={1} />
        <Paper offsetTop="3%"  widthPct={82} rotate={2}  z={2} />
        <Paper offsetTop="0%"  widthPct={80} rotate={-1} z={3} />

        {/* Folder back / tab */}
        <div
          className="absolute left-0 right-0 top-[12%] h-[24%] rounded-t-[18px]"
          style={{
            background: top,
            filter: "brightness(0.92)",
            zIndex: 4,
          }}
        >
          <div
            className="absolute left-0 top-0 h-full w-[55%] rounded-t-[18px] rounded-br-[14px]"
            style={{ background: top, filter: "brightness(0.85)" }}
          />
        </div>

        {/* Folder front body */}
        <div
          className="absolute left-0 right-0 top-[30%] bottom-0 rounded-[18px]"
          style={{
            background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`,
            boxShadow:
              "inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.08)",
            zIndex: 5,
          }}
        />

        {/* Subtle highlight */}
        <div
          className="absolute left-3 right-3 top-[32%] h-[5%] rounded-full opacity-40 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.55)", zIndex: 6 }}
        />

        {/* Status dot */}
        <span
          className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full z-10"
          style={{
            backgroundColor: hasFiles ? "#4CAF7D" : "#BDBDBD",
            boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
          }}
        />
      </div>

      <div className="flex items-baseline gap-1.5 px-0.5 w-full">
        <span
          className="text-sm font-medium truncate"
          style={{ color: "#333" }}
        >
          {subject.name}
        </span>
        <span className="text-xs flex-shrink-0" style={{ color: "#999" }}>
          {fileCount} {fileCount === 1 ? "doc" : "docs"}
        </span>
      </div>
    </button>
  );
};

const Paper = ({
  offsetTop,
  widthPct,
  rotate,
  z,
}: {
  offsetTop: string;
  widthPct: number;
  rotate: number;
  z: number;
}) => (
  <div
    className="absolute left-1/2 rounded-md bg-white"
    style={{
      top: offsetTop,
      width: `${widthPct}%`,
      height: "32%",
      transform: `translateX(-50%) rotate(${rotate}deg)`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      zIndex: z,
    }}
  />
);

// Darken/lighten a hex color by percentage (-100..100)
function shade(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (percent / 100) * 255)));
  return `#${[adj(r), adj(g), adj(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}
