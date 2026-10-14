import { useEffect, useState } from "react";
import { Check, X, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Props {
  onNavigate: (section: string) => void;
  onResumeOnboarding?: () => void;
  showResume: boolean;
}

interface Item { key: string; label: string; done: boolean; target: string }

/**
 * "Bien démarrer avec Orbit" checklist on the desktop dashboard.
 * Reflects real account data, updates automatically, dismissible forever
 * (profiles.preferences.checklist_dismissed).
 */
export function GettingStartedCard({ onNavigate, onResumeOnboarding, showResume }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    (async () => {
      const [profile, settings, subjects, tasks, chats, drive] = await Promise.all([
        supabase.from("profiles").select("display_name, preferences").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_settings").select("ical_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("subjects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("ai_conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.functions.invoke("google-drive", { body: { action: "status" } }).catch(() => ({ data: null })),
      ]);
      if (!alive) return;
      const prefs = (profile.data?.preferences as Record<string, unknown> | null) ?? {};
      setDismissed(prefs.checklist_dismissed === true);
      setItems([
        { key: "profile", label: "Compléter mon profil", done: !!profile.data?.display_name, target: "settings" },
        { key: "drive", label: "Connecter Google Drive", done: !!(drive as any)?.data?.connected, target: "drive" },
        { key: "calendar", label: "Connecter mon calendrier", done: !!settings.data?.ical_url, target: "settings" },
        { key: "subject", label: "Ajouter mon premier cours", done: (subjects.count ?? 0) > 0, target: "subjects" },
        { key: "task", label: "Créer ma première tâche", done: (tasks.count ?? 0) > 0, target: "home" },
        { key: "ai", label: "Essayer Orbit AI", done: (chats.count ?? 0) > 0, target: "ai" },
      ]);
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const dismiss = async () => {
    setDismissed(true);
    if (!user?.id) return;
    const { data } = await supabase.from("profiles").select("preferences").eq("user_id", user.id).maybeSingle();
    const preferences = { ...((data?.preferences as Record<string, unknown> | null) ?? {}), checklist_dismissed: true };
    await supabase.from("profiles").update({ preferences }).eq("user_id", user.id);
  };

  if (dismissed || !items) return null;
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length && !showResume) return null;

  return (
    <section className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Bien démarrer avec Orbit</h2>
          <p className="text-sm text-muted-foreground mt-1">{doneCount}/{items.length} terminés</p>
        </div>
        <button onClick={dismiss} aria-label="Masquer définitivement" className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {showResume && onResumeOnboarding && (
        <button onClick={onResumeOnboarding}
          className="w-full mb-4 rounded-2xl bg-primary/10 p-4 flex items-center gap-3 text-left hover:bg-primary/15 transition-colors">
          <span className="flex-1 text-sm font-medium text-primary">Terminer la configuration de ton espace</span>
          <ChevronRight className="w-4 h-4 text-primary" />
        </button>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {items.map((i) => (
          <li key={i.key}>
            <button onClick={() => !i.done && onNavigate(i.target)} disabled={i.done}
              className={cn("w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors", !i.done && "hover:bg-muted/50")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                i.done ? "bg-success/15 text-success" : "border-2 border-muted-foreground/30")}>
                {i.done && <Check className="w-3.5 h-3.5" />}
              </span>
              <span className={cn("text-sm", i.done ? "text-muted-foreground line-through" : "font-medium")}>{i.label}</span>
              {!i.done && <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
