import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";

export type CompanionState = "idle" | "listening" | "thinking" | "speaking" | "success" | "interrupted" | "error";

export interface CompanionHandle {
  /** 0 = closed, 1 = wide open. Written per frame, no React re-render. */
  setMouth: (open: number, round?: number) => void;
  /** 0..1 mic level for the listening halo. */
  setLevel: (level: number) => void;
}

/**
 * The existing Orbit blob — same silhouette, gradient and eyes — with animated layers
 * (eyelids, gaze, mouth, halo). All per-frame motion goes through refs.
 */
export const OrbitCompanion = forwardRef<CompanionHandle, { state?: CompanionState; size?: number; className?: string }>(
  ({ state = "idle", size = 72, className }, ref) => {
    const mouthRef = useRef<SVGEllipseElement>(null);
    const smileRef = useRef<SVGPathElement>(null);
    const eyesRef = useRef<SVGGElement>(null);
    const haloRef = useRef<HTMLDivElement>(null);
    const target = useRef({ open: 0, round: 0, level: 0 });
    const cur = useRef({ open: 0, round: 0, level: 0 });
    const stateRef = useRef(state);
    stateRef.current = state;

    useImperativeHandle(ref, () => ({
      setMouth: (open, round = 0) => { target.current.open = Math.max(0, Math.min(1, open)); target.current.round = round; },
      setLevel: (l) => { target.current.level = Math.max(0, Math.min(1, l)); },
    }), []);

    // Mouth must snap closed whenever we leave speaking.
    useEffect(() => { if (state !== "speaking") { target.current.open = 0; cur.current.open = 0; } }, [state]);

    useEffect(() => {
      let raf = 0; let nextBlink = performance.now() + 2500; let blinkEnd = 0; let gazeT = 0; let gx = 0; let gy = 0; let tgx = 0; let tgy = 0;
      const tick = (t: number) => {
        const c = cur.current, g = target.current;
        c.open += (g.open - c.open) * 0.35;
        c.round += (g.round - c.round) * 0.3;
        c.level += (g.level - c.level) * 0.2;
        const speaking = stateRef.current === "speaking";
        const o = speaking ? c.open : 0;
        if (mouthRef.current) {
          mouthRef.current.setAttribute("ry", String(0.4 + o * 5));
          mouthRef.current.setAttribute("rx", String(5.5 - c.round * 2.2 * o));
          mouthRef.current.style.opacity = o > 0.04 ? "1" : "0";
        }
        if (smileRef.current) smileRef.current.style.opacity = o > 0.04 ? "0" : "1";
        // blink
        if (t > nextBlink) { blinkEnd = t + 130; nextBlink = t + 2500 + Math.random() * 3500; }
        const blink = t < blinkEnd ? 0.1 : 1;
        // gaze drift
        if (t > gazeT) { gazeT = t + 1500 + Math.random() * 2500; const s = stateRef.current === "thinking" ? 2.5 : 1.2; tgx = (Math.random() - 0.5) * s; tgy = stateRef.current === "thinking" ? -1.5 : (Math.random() - 0.5) * s * 0.6; }
        if (stateRef.current === "listening") { tgx = 0; tgy = 0; }
        gx += (tgx - gx) * 0.06; gy += (tgy - gy) * 0.06;
        if (eyesRef.current) eyesRef.current.setAttribute("transform", `translate(${gx} ${gy}) translate(50 50) scale(1 ${blink * (stateRef.current === "listening" ? 1.1 : 1)}) translate(-50 -50)`);
        if (haloRef.current) {
          const l = stateRef.current === "listening" ? c.level : speaking ? c.open * 0.6 : 0;
          haloRef.current.style.transform = `scale(${1 + l * 0.35})`;
          haloRef.current.style.opacity = String(stateRef.current === "idle" || stateRef.current === "error" ? 0 : 0.35 + l * 0.5);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, []);

    return (
      <div className={cn("relative", className)} style={{ width: size, height: size }} aria-label={`Orbit — ${state}`}>
        <div ref={haloRef} className={cn("absolute inset-[-18%] rounded-full bg-primary/25 blur-2xl transition-opacity duration-500", state === "thinking" && "animate-pulse")} style={{ opacity: 0 }} />
        <div className={cn(
          "relative w-full h-full",
          state === "idle" && "animate-[float_4s_ease-in-out_infinite]",
          state === "listening" && "animate-[float_3s_ease-in-out_infinite] scale-[1.03]",
          state === "thinking" && "animate-[spin_9s_linear_infinite] [animation-direction:alternate]",
          state === "speaking" && "animate-[float_2.4s_ease-in-out_infinite]",
          state === "success" && "animate-[bounce_0.6s_ease-out_1]",
          state === "error" && "opacity-80",
          "transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        )} style={state === "thinking" ? { animation: "orbitThink 2.4s ease-in-out infinite" } : undefined}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_25px_hsl(var(--primary)/0.25)]">
            <defs>
              <radialGradient id="orbitBlobV" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="hsl(var(--background))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </radialGradient>
            </defs>
            <path fill="url(#orbitBlobV)" d="M50 6c8 0 11 7 18 9s15-1 19 6-1 13 1 20 9 11 6 18-11 8-15 14-4 14-12 17-12-4-17-4-11 7-18 4-6-11-12-17-14-6-16-14 5-12 4-19-8-12-3-19 13-3 19-6S42 6 50 6z" />
            <g ref={eyesRef}>
              <ellipse cx="41" cy="50" rx="3.5" ry="5" fill="hsl(var(--foreground))" />
              <ellipse cx="59" cy="50" rx="3.5" ry="5" fill="hsl(var(--foreground))" />
            </g>
            <path ref={smileRef} d="M46 59 Q50 62 54 59" stroke="hsl(var(--foreground))" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <ellipse ref={mouthRef} cx="50" cy="60.5" rx="5.5" ry="0.4" fill="hsl(var(--foreground))" style={{ opacity: 0 }} />
          </svg>
        </div>
        <style>{`@keyframes orbitThink{0%,100%{transform:rotate(-4deg) translateY(0)}50%{transform:rotate(4deg) translateY(-3px)}}`}</style>
      </div>
    );
  },
);
OrbitCompanion.displayName = "OrbitCompanion";
