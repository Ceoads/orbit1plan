import { forwardRef } from "react";
import { Sparkles, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Orbit's signature loading indicator: the rotating Sparkles from the demo.
 * Only render it while something is actually loading.
 */
export const OrbitSpinner = forwardRef<SVGSVGElement, LucideProps>(({ className, ...props }, ref) => (
  <Sparkles
    ref={ref}
    role="status"
    aria-label="Chargement"
    {...props}
    className={cn(
      "text-primary",
      (className ?? "").replace(/\banimate-spin\b/g, ""),
      "animate-[spin_2s_linear_infinite] motion-reduce:animate-pulse",
    )}
  />
));
OrbitSpinner.displayName = "OrbitSpinner";

export function OrbitPageLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-screen mesh-background flex flex-col items-center justify-center gap-4">
      <OrbitSpinner className="w-12 h-12" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
