import { confirmAction } from "@/components/ConfirmHost";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Plus, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Semester { id: string; name: string; start_date: string; end_date: string; is_current: boolean | null }
interface Row { id: string; title: string; status: "todo" | "done"; due_date: string | null; subject_id: string | null; reminder_enabled: boolean; reminder_sent_at: string | null }
interface Subj { id: string; name: string }

const dayKey = (iso: string) => iso.slice(0, 10);
const fmt = (iso: string) => new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Suivi des échéances par semestre, avec rappel e-mail 24 h avant. Les échéances apparaissent aussi dans le calendrier. */
export function SemesterTasks() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subj[]>([]);
  const [tasks, setTasks] = useState<Row[] | null>(null);
  const [semId, setSemId] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [s, sub, t] = await Promise.all([
      supabase.from("semesters").select("id,name,start_date,end_date,is_current").order("start_date", { ascending: false }),
      supabase.from("subjects").select("id,name").order("name"),
      supabase.from("tasks").select("id,title,status,due_date,subject_id,reminder_enabled,reminder_sent_at").not("due_date", "is", null).order("due_date"),
    ]);
    const sems = (s.data ?? []) as Semester[];
    setSemesters(sems); setSubjects((sub.data ?? []) as Subj[]); setTasks((t.data ?? []) as Row[]);
    setSemId((cur) => {
      if (cur !== "all") return cur;
      const today = new Date().toISOString().slice(0, 10);
      return (sems.find((x) => x.is_current) ?? sems.find((x) => x.start_date <= today && x.end_date >= today))?.id ?? "all";
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  const sem = semesters.find((s) => s.id === semId);
  const list = useMemo(() => (tasks ?? []).filter((t) => !sem || (t.due_date && dayKey(t.due_date) >= sem.start_date && dayKey(t.due_date) <= sem.end_date)), [tasks, sem]);
  const done = list.filter((t) => t.status === "done").length;
  const now = Date.now();
  const late = list.filter((t) => t.status === "todo" && new Date(t.due_date!).getTime() < now);
  const upcoming = list.filter((t) => t.status === "todo" && new Date(t.due_date!).getTime() >= now);
  const finished = list.filter((t) => t.status === "done");

  const add = async () => {
    if (!user || !title.trim() || !due) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id, title: title.trim(), due_date: new Date(due).toISOString(), subject_id: subjectId || null,
      priority_score: 70, energy_level: "medium", reminder_enabled: true,
    });
    setSaving(false);
    if (error) return toast.error("Création impossible");
    setTitle(""); setDue(""); toast.success("Échéance ajoutée · rappel par e-mail 24 h avant"); load();
  };

  const update = async (id: string, v: Partial<Row>) => {
    setTasks((ts) => ts?.map((t) => t.id === id ? { ...t, ...v } : t) ?? null);
    const { error } = await supabase.from("tasks").update(v).eq("id", id);
    if (error) { toast.error("Mise à jour impossible"); load(); }
  };

  const removeTask = async (t: Row) => {
    if (!(await confirmAction({ title: "Supprimer cette échéance ?", description: t.title }))) return;
    setTasks((ts) => ts?.filter((x) => x.id !== t.id) ?? null);
    const { error } = await supabase.from("tasks").delete().eq("id", t.id);
    if (error) { toast.error("Suppression impossible"); load(); } else toast.success("Échéance supprimée");
  };

  const subjName = (id: string | null) => subjects.find((s) => s.id === id)?.name;

  const Item = ({ t }: { t: Row }) => (
    <li className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <button aria-label={t.status === "done" ? "Marquer à faire" : "Marquer fait"} onClick={() => update(t.id, { status: t.status === "done" ? "todo" : "done" })}
        className={cn("w-11 h-11 -m-2 shrink-0 flex items-center justify-center")}>
        <span className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", t.status === "done" ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40")}>
          {t.status === "done" && <Check className="w-3 h-3" />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{fmt(t.due_date!)}{subjName(t.subject_id) ? ` · ${subjName(t.subject_id)}` : ""}</p>
      </div>
      {t.status === "todo" && (
        <button aria-label={t.reminder_enabled ? "Désactiver le rappel" : "Activer le rappel"} onClick={() => update(t.id, { reminder_enabled: !t.reminder_enabled, reminder_sent_at: null })}
          className={cn("w-11 h-11 rounded-full flex items-center justify-center", t.reminder_enabled ? "text-primary" : "text-muted-foreground")}>
          {t.reminder_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
      )}
      <button aria-label="Supprimer" onClick={() => removeTask(t)} className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
    </li>
  );

  if (!tasks) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[{ id: "all", name: "Tout" }, ...semesters].map((s) => (
          <button key={s.id} onClick={() => setSemId(s.id)}
            className={cn("h-10 px-4 rounded-full text-sm font-medium whitespace-nowrap", semId === s.id ? "bg-foreground text-background" : "bg-card text-muted-foreground")}>{s.name}</button>
        ))}
      </div>

      <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-3xl font-bold">{list.length ? Math.round((done / list.length) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">{done}/{list.length} terminées{late.length ? ` · ${late.length} en retard` : ""}</p>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} /></div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nouvelle échéance (ex. rendu TP)" className="h-12 px-4 rounded-2xl bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Date d'échéance" className="h-12 px-4 rounded-2xl bg-muted/50 text-sm outline-none" />
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Matière" className="h-12 px-4 rounded-2xl bg-muted/50 text-sm outline-none max-w-[200px]">
          <option value="">Sans matière</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" disabled={saving || !title.trim() || !due} className="h-12 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </form>

      {[["En retard", late], ["À venir", upcoming], ["Terminées", finished]].map(([label, rows]) => (rows as Row[]).length > 0 && (
        <section key={label as string}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">{label as string}</p>
          <ul className="bg-card rounded-3xl px-6 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">{(rows as Row[]).map((t) => <Item key={t.id} t={t} />)}</ul>
        </section>
      ))}
      {list.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">Aucune échéance pour ce semestre.</p>}
      <p className="text-xs text-muted-foreground text-center">La cloche active un rappel par e-mail 24 h avant l'échéance. Tes échéances apparaissent aussi dans le calendrier.</p>
    </div>
  );
}
