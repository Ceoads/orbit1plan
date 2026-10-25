import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEPS: Record<string, { label: string; at: number }[]> = {
  create: [
    { label: "Lecture de tes cours", at: 0 },
    { label: "Repérage des notions clés", at: 3 },
    { label: "Rédaction des leçons", at: 7 },
    { label: "Création des questions", at: 13 },
    { label: "Enregistrement du parcours", at: 19 },
  ],
  practice: [
    { label: "Analyse de tes réponses", at: 0 },
    { label: "Explication plus simple", at: 3 },
    { label: "Nouvelles questions", at: 7 },
    { label: "Préparation de l’activité", at: 11 },
  ],
};

/** Time-based staged progress while the server generates; never claims completion before the response. */
export function GenerationProgress({ kind }: { kind: "create" | "practice" }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const t = setInterval(() => setElapsed(e => e + 0.5), 500); return () => clearInterval(t); }, []);
  const steps = STEPS[kind];
  const total = steps[steps.length - 1].at + 4;
  const current = steps.reduce((acc, s, i) => (elapsed >= s.at ? i : acc), 0);
  const value = Math.min(92, (elapsed / total) * 92);
  return (
    <div role="status" aria-live="polite" className="rounded-2xl bg-card p-6 shadow-soft space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">Orbit prépare {kind === "create" ? "ton parcours" : "ta pratique ciblée"}</p>
        <span className="text-xs text-muted-foreground tabular-nums">{Math.floor(elapsed)} s</span>
      </div>
      <Progress value={value} className="h-2" />
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.label} className={cn("flex items-center gap-3 text-sm", i > current && "text-muted-foreground")}>
            {i < current ? <Check className="h-4 w-4 text-primary" /> : i === current ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <span className="h-4 w-4 rounded-full bg-muted" />}
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
