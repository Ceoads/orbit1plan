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
 * Minimalist frosted folder card (inspired by Invoices reference).
 * - Body: soft off-white glassy gradient (color-agnostic)
 * - Course color lives only as 2-3 tinted papers peeking from the top-left
 * - Centered label below: "Name  4"
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
            {fileCount} {fileCount === 1 ? "document" : "documents"}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </button>
    );
  }

  // Soft tint of the course color for peeking papers (color mixed with white)
  const paperTint = mix(color.hex, "#FFFFFF", 0.62);
  const paperTintDeep = mix(color.hex, "#FFFFFF", 0.5);

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-center gap-3 group text-center"
    >
      <div
        className="relative w-full transition-transform duration-200 ease-out group-hover:scale-[1.03] group-active:scale-[0.97]"
        style={{ aspectRatio: "160 / 180" }}
      >
        {/* Peeking papers (top-left corner) — drawn first so the body covers their bottoms */}
        {hasFiles && (
          <>
            <TintedPaper
              top="2%"
              left="14%"
              widthPct={52}
              rotate={-10}
              fill={paperTintDeep}
              z={1}
            />
            <TintedPaper
              top="0%"
              left="22%"
              widthPct={50}
              rotate={-3}
              fill={paperTint}
              z={2}
              chip="ok"
            />
            <TintedPaper
              top="3%"
              left="30%"
              widthPct={48}
              rotate={5}
              fill="#FFFFFF"
              z={3}
            />
          </>
        )}

        {/* Folder tab (top-left bump) */}
        <div
          className="absolute top-[14%] left-0 h-[16%] w-[46%] rounded-tl-[24px] rounded-tr-[18px]"
          style={{
            background: "linear-gradient(180deg, #EFEFEF 0%, #E6E6E6 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            zIndex: 4,
          }}
        />

        {/* Folder body */}
        <div
          className="absolute left-0 right-0 top-[26%] bottom-0 rounded-[26px]"
          style={{
            background:
              "linear-gradient(180deg, #F4F4F4 0%, #ECECEC 55%, #E4E4E4 100%)",
            boxShadow:
              "0 10px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)",
            zIndex: 5,
          }}
        />

        {/* Subtle top highlight on the body */}
        <div
          className="absolute left-3 right-3 top-[28%] h-[6%] rounded-full opacity-60 pointer-events-none"
          style={{ background: "rgba(255,255,255,0.7)", zIndex: 6 }}
        />

        {/* Empty-state tiny dot */}
        {!hasFiles && (
          <span
            className="absolute top-[18%] left-[18%] w-2 h-2 rounded-full"
            style={{
              backgroundColor: "#C7C7CC",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              zIndex: 7,
            }}
          />
        )}
      </div>

      <div className="flex items-baseline justify-center gap-1.5 w-full px-1">
        <span
          className="text-sm font-medium truncate max-w-full"
          style={{ color: "#1A1A1A" }}
        >
          {subject.name}
        </span>
        <span className="text-sm flex-shrink-0" style={{ color: "#9A9A9A" }}>
          {fileCount}
        </span>
      </div>
    </button>
  );
};

const TintedPaper = ({
  top,
  left,
  widthPct,
  rotate,
  fill,
  z,
  chip,
}: {
  top: string;
  left: string;
  widthPct: number;
  rotate: number;
  fill: string;
  z: number;
  chip?: "ok";
}) => (
  <div
    className="absolute rounded-[6px]"
    style={{
      top,
      left,
      width: `${widthPct}%`,
      height: "32%",
      background: fill,
      transform: `rotate(${rotate}deg)`,
      transformOrigin: "bottom left",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      zIndex: z,
    }}
  >
    {chip === "ok" && (
      <span
        className="absolute -top-1 -left-1 w-3 h-3 rounded-full flex items-center justify-center"
        style={{
          background: "#4CAF7D",
          boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
        }}
      >
        <svg viewBox="0 0 8 8" className="w-2 h-2">
          <path
            d="M1.5 4.2 L3.2 5.8 L6.5 2.5"
            stroke="white"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )}
  </div>
);

// Mix two hex colors. amount = weight of color B (0..1).
function mix(a: string, b: string, amount: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa.r * (1 - amount) + pb.r * amount);
  const g = Math.round(pa.g * (1 - amount) + pb.g * amount);
  const bl = Math.round(pa.b * (1 - amount) + pb.b * amount);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
function parseHex(h: string) {
  const v = h.replace("#", "");
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
