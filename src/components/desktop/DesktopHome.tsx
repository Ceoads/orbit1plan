import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle2, GraduationCap, ListTodo } from "lucide-react";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { CalendarPocketSpace } from "@/components/calendar";
import { toLocalDateStr } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";

type Kind = "task" | "exam";
interface PadItem { id: string; kind: Kind; text: string; taskId?: string | null }

/** Notepad "day" starts at 07:30 Europe/Paris. Returns YYYY-MM-DD of the current cycle. */
const parisCycleKey = (now = new Date()) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(now).map((x) => [x.type, x.value])
  );
  const mins = (Number(p.hour) % 24) * 60 + Number(p.minute);
  const d = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
  if (mins < 7 * 60 + 30) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];

export const DesktopHome = ({ greeting }: { greeting: string }) => {
  const { user } = useAuth();
  const { events, subjects, tasks, createTask, toggleTask, getTodayEvents, getSubjectById } = useOrbitData();
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [openDate, setOpenDate] = useState<Date | null>(null);

  // ---- Notepad (resets daily at 07:30 Paris) ----
  const [cycle, setCycle] = useState(parisCycleKey());
  useEffect(() => { const i = setInterval(() => setCycle(parisCycleKey()), 30000); return () => clearInterval(i); }, []);
  const storeKey = `orbit_notepad_${user?.id}_${cycle}`;
  const [items, setItems] = useState<PadItem[]>([]);
  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(storeKey) || "[]"));
    // clean older cycles
    Object.keys(localStorage).forEach((k) => { if (k.startsWith(`orbit_notepad_${user?.id}_`) && k !== storeKey) localStorage.removeItem(k); });
  }, [storeKey, user?.id]);
  const save = (next: PadItem[]) => { setItems(next); localStorage.setItem(storeKey, JSON.stringify(next)); };

  const add = async (kind: Kind, text: string) => {
    const t = text.trim();
    if (!t) return;
    const due = new Date(); due.setHours(23, 59, 0, 0);
    const created = await createTask({
      title: kind === "exam" ? `Examen : ${t}` : t,
      priority_score: kind === "exam" ? 90 : 60,
      energy_level: kind === "exam" ? "high" : "medium",
      due_date: due.toISOString(),
    });
    save([...items, { id: crypto.randomUUID(), kind, text: t, taskId: (created as { id?: string } | null)?.id ?? null }]);
  };
  const remove = (id: string) => save(items.filter((i) => i.id !== id));
  const isDone = (i: PadItem) => !!i.taskId && tasks.find((t) => t.id === i.taskId)?.status === "done";

  const cycleLabel = new Date(cycle + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  // ---- Mini calendar ----
  const days = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first); start.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);
  const marks = useMemo(() => {
    const m: Record<string, { cls: boolean; exam: boolean }> = {};
    events.forEach((e) => {
      const k = e.event_type === "exam" ? e.exam_date || e.event_date : e.event_date;
      if (!k) return;
      m[k] ??= { cls: false, exam: false };
      if (e.event_type === "exam") m[k].exam = true; else m[k].cls = true;
    });
    return m;
  }, [events]);
  const todayStr = toLocalDateStr(new Date());
  const today = getTodayEvents?.() ?? [];

  // ---- Tâches du jour (due today or overdue, not subtasks) ----
  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.is_subtask && t.due_date && toLocalDateStr(new Date(t.due_date)) <= todayStr)
      .sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) || (b.priority_score ?? 0) - (a.priority_score ?? 0));
  }, [tasks, todayStr]);
  const remainingCount = todayTasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-4xl font-bold tracking-tight mt-1">{greeting} 👋</h1>
        <p className="text-muted-foreground mt-2">
          {today.length ? `Tu as ${today.length} cours aujourd'hui.` : "Aucun cours aujourd'hui — profite-en."}
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Mini calendar */}
        <section className="xl:col-span-2 bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold capitalize">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2>
            <div className="flex gap-1">
              <button aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
              <button aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK.map((w, i) => <div key={i} className="text-xs font-medium text-muted-foreground pb-2">{w}</div>)}
            {days.map((d) => {
              const k = toLocalDateStr(d);
              const inMonth = d.getMonth() === month.getMonth();
              const mk = marks[k];
              return (
                <button
                  key={k}
                  onClick={() => setOpenDate(d)}
                  className={cn(
                    "relative h-11 rounded-xl text-sm transition-colors hover:bg-muted",
                    !inMonth && "text-muted-foreground/40",
                    k === todayStr && "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  )}
                >
                  {d.getDate()}
                  {mk && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {mk.cls && <span className={cn("w-1 h-1 rounded-full", k === todayStr ? "bg-primary-foreground" : "bg-primary")} />}
                      {mk.exam && <span className="w-1 h-1 rounded-full bg-warning" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-6">Clique sur un jour pour ouvrir ton emploi du temps.</p>

          {today.length > 0 && (
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold">Aujourd'hui</h3>
              {today.slice(0, 4).map((e) => {
                const s = getSubjectById(e.subject_id);
                return (
                  <button key={e.id} onClick={() => setOpenDate(new Date())} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted text-left">
                    <span className="text-lg">{s?.icon || "📘"}</span>
                    <span className="flex-1 min-w-0 truncate text-sm font-medium">{s?.name || e.title}</span>
                    <span className="text-xs text-muted-foreground">{e.start_time.slice(0, 5)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Notepad */}
        <section className="xl:col-span-3 bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Bloc-notes du jour</h2>
            <p className="text-sm text-muted-foreground capitalize">{cycleLabel} · se vide chaque matin à 7h30</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PadColumn title="Tâches" icon={ListTodo} kind="task" items={items.filter((i) => i.kind === "task")} onAdd={add} onRemove={remove} isDone={isDone} placeholder="Ajouter une tâche…" />
            <PadColumn title="Examens" icon={GraduationCap} kind="exam" items={items.filter((i) => i.kind === "exam")} onAdd={add} onRemove={remove} isDone={isDone} placeholder="Ajouter un examen à réviser…" />
          </div>
          <p className="text-xs text-muted-foreground mt-6">Chaque ligne crée aussi une tâche dans ta liste Tâches.</p>
        </section>
      </div>

      <CalendarPocketSpace
        isOpen={!!openDate}
        onClose={() => setOpenDate(null)}
        events={events}
        subjects={subjects}
        initialDate={openDate ?? new Date()}
      />
    </div>
  );
};

const PadColumn = ({ title, icon: Icon, kind, items, onAdd, onRemove, isDone, placeholder }: {
  title: string; icon: typeof ListTodo; kind: Kind; items: PadItem[];
  onAdd: (k: Kind, t: string) => Promise<void>; onRemove: (id: string) => void; isDone: (i: PadItem) => boolean; placeholder: string;
}) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => { if (!text.trim() || busy) return; setBusy(true); await onAdd(kind, text); setText(""); setBusy(false); };
  return (
    <div className="rounded-2xl bg-muted/30 p-5 min-h-[280px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={cn("w-4 h-4", kind === "exam" ? "text-warning" : "text-primary")} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
      </div>
      <ul className="space-y-1 flex-1">
        {items.map((i) => (
          <li key={i.id} className="group flex items-center gap-2 py-2 border-b border-border/40">
            {isDone(i) ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> : <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 ml-1", kind === "exam" ? "bg-warning" : "bg-primary")} />}
            <span className={cn("flex-1 text-sm", isDone(i) && "line-through text-muted-foreground")}>{i.text}</span>
            <button aria-label="Retirer du bloc-notes" onClick={() => onRemove(i.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex items-center gap-2 mt-4">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="flex-1 h-10 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Ajouter" className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"><Plus className="w-4 h-4" /></button>
      </form>
    </div>
  );
};
