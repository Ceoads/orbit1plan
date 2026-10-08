import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Row = { provider: string; requests: number; failures: number; daily_limit: number; blocked_until: string | null; last_error: string | null };

const LABELS: Record<string, string> = {
  openai: "ChatGPT (ta clé OpenAI)",
  gemini: "Gemini · discussion",
  "gemini-image": "Gemini · images",
  claude: "Claude (crédits Lovable)",
};

/** Admin-only: today's usage per AI provider. Hidden for everyone else. */
export function AIUsageCard() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    supabase.functions.invoke("orbit-ai", { body: { action: "usage" } }).then(({ data, error }) => {
      if (!error && data?.usage) setRows(data.usage);
    });
  }, []);

  if (!rows) return null;
  const all = Object.keys(LABELS).map((p) => rows.find((r) => r.provider === p) ?? { provider: p, requests: 0, failures: 0, daily_limit: 500, blocked_until: null, last_error: null });

  return (
    <div className="rounded-3xl bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">IA d'Orbit · aujourd'hui</h3>
        <p className="text-xs text-muted-foreground mt-1">Chaque IA a son propre budget : si l'une est à court, Orbit passe aux autres.</p>
      </div>
      {all.map((r) => {
        const paused = r.blocked_until && new Date(r.blocked_until) > new Date();
        const left = Math.max(0, r.daily_limit - r.requests);
        const pct = Math.min(100, (r.requests / r.daily_limit) * 100);
        return (
          <div key={r.provider} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{LABELS[r.provider]}</span>
              <span className={`text-xs ${paused ? "text-destructive" : "text-muted-foreground"}`}>
                {paused ? "Limite atteinte · en pause" : `${left} demandes restantes`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${paused ? "bg-destructive" : "bg-primary"}`} style={{ width: `${paused ? 100 : pct}%` }} />
            </div>
            {r.failures > 0 && <p className="text-[11px] text-muted-foreground">{r.failures} échec(s) aujourd'hui</p>}
          </div>
        );
      })}
    </div>
  );
}
