import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SubjectIcon } from "@/components/SubjectIcon";
import { confirmAction } from "@/components/ConfirmHost";
import { appendToTodayNotepad } from "@/lib/notepad";
import { toLocalDateStr } from "@/lib/dateFormat";

interface Subject { id: string; name: string; icon: string | null }
interface Grade { id: string; subject_id: string | null; label: string; value: number; max_value: number; coefficient: number; grade_date: string }

/** Weighted average out of 20. */
const avg20 = (gs: Grade[]) => {
  const w = gs.reduce((a, g) => a + g.coefficient, 0);
  return w ? gs.reduce((a, g) => a + (g.value / g.max_value) * 20 * g.coefficient, 0) / w : null;
};
const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }));

export function GradesPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject_id: "", label: "", value: "", max_value: "20", coefficient: "1", grade_date: toLocalDateStr(new Date()), toPad: true });

  const load = useCallback(async () => {
    if (!user) return;
    const [s, g] = await Promise.all([
      supabase.from("subjects").select("id,name,icon").eq("user_id", user.id).order("name"),
      supabase.from("grades").select("id,subject_id,label,value,max_value,coefficient,grade_date").eq("user_id", user.id).order("grade_date", { ascending: false }),
    ]);
    setSubjects((s.data as Subject[]) ?? []);
    setGrades(((g.data ?? []) as Grade[]).map((x) => ({ ...x, value: Number(x.value), max_value: Number(x.max_value), coefficient: Number(x.coefficient) })));
    setLoading(false);
  }, [user]);
  useEffect(() => { load(); }, [load]);
  // Live sync across devices (same as the daily notepad).
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`grades-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "grades", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const bySubject = useMemo(() => subjects.map((s) => ({ s, gs: grades.filter((g) => g.subject_id === s.id) })).filter((x) => x.gs.length), [subjects, grades]);
  const overall = useMemo(() => avg20(grades), [grades]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const value = Number(form.value.replace(",", ".")), max = Number(form.max_value.replace(",", ".")), coef = Number(form.coefficient.replace(",", "."));
    if (!form.subject_id || !form.label.trim() || !(value >= 0) || !(max > 0) || value > max || !(coef > 0)) { toast.error("Vérifie la matière, l'intitulé et la note."); return; }
    setSaving(true);
    const { error } = await supabase.from("grades").insert({ user_id: user.id, subject_id: form.subject_id, label: form.label.trim().slice(0, 120), value, max_value: max, coefficient: coef, grade_date: form.grade_date });
    if (error) { setSaving(false); toast.error("Enregistrement impossible"); return; }
    if (form.toPad) {
      const sName = subjects.find((s) => s.id === form.subject_id)?.name ?? "";
      try { await appendToTodayNotepad(user.id, `Note ${sName} · ${form.label.trim()} : ${fmt(value)}/${fmt(max)}`); } catch { toast.error("Note enregistrée, mais pas ajoutée au bloc-notes"); }
    }
    setSaving(false);
    toast.success(form.toPad ? "Note ajoutée · visible dans le bloc-notes du jour" : "Note ajoutée");
    setForm((f) => ({ ...f, label: "", value: "" }));
    load();
  };

  const remove = async (g: Grade) => {
    if (!(await confirmAction({ title: `Supprimer « ${g.label} » ?`, description: `${fmt(g.value)}/${fmt(g.max_value)}` }))) return;
    const { error } = await supabase.from("grades").delete().eq("id", g.id);
    if (error) toast.error("Suppression impossible"); else load();
  };

  const input = "h-11 px-4 rounded-2xl bg-muted/50 outline-none focus:ring-2 focus:ring-primary/30 text-sm";

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mes notes</h1>
          <p className="text-muted-foreground mt-2">Tes notes officielles par matière, avec ta moyenne pondérée.</p>
        </div>
        <div className="bg-card rounded-3xl px-8 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Moyenne générale</p>
          <p className="text-4xl font-bold tracking-tight">{fmt(overall)}<span className="text-lg text-muted-foreground font-medium">/20</span></p>
        </div>
      </div>

      <form onSubmit={add} className="bg-card rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
        <p className="font-semibold">Ajouter une note</p>
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
          <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className={`${input} col-span-2 md:col-span-3`} required>
            <option value="">Matière…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Intitulé (ex. Partiel)" maxLength={120} className={`${input} col-span-2 md:col-span-3`} required />
          <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Note" inputMode="decimal" className={`${input} col-span-1 md:col-span-1`} required />
          <input value={form.max_value} onChange={(e) => setForm({ ...form, max_value: e.target.value })} placeholder="Sur" inputMode="decimal" className={`${input} col-span-1 md:col-span-1`} aria-label="Note maximale" />
          <input value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} placeholder="Coef." inputMode="decimal" className={`${input} col-span-1 md:col-span-1`} aria-label="Coefficient" />
          <input type="date" value={form.grade_date} onChange={(e) => setForm({ ...form, grade_date: e.target.value })} className={`${input} col-span-1 md:col-span-2`} required />
          <button disabled={saving} className="col-span-2 md:col-span-1 h-11 rounded-2xl bg-foreground text-background flex items-center justify-center disabled:opacity-60" aria-label="Ajouter">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer w-fit">
          <input type="checkbox" checked={form.toPad} onChange={(e) => setForm({ ...form, toPad: e.target.checked })} className="accent-primary w-4 h-4" />
          Ajouter aussi au bloc-notes du jour
        </label>
      </form>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        : bySubject.length === 0 ? <p className="text-center text-muted-foreground py-16">Aucune note pour l'instant. Ajoute ta première note ci-dessus.</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bySubject.map(({ s, gs }) => (
              <div key={s.id} className="bg-card rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
                <div className="flex items-center gap-3">
                  <SubjectIcon name={s.name} legacyIcon={s.icon} size="sm" />
                  <p className="font-semibold flex-1 truncate">{s.name}</p>
                  <p className="text-2xl font-bold tracking-tight">{fmt(avg20(gs))}<span className="text-sm text-muted-foreground font-medium">/20</span></p>
                </div>
                <div className="space-y-1">
                  {gs.map((g) => (
                    <div key={g.id} className="group flex items-center gap-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{g.label}</p>
                        <p className="text-xs text-muted-foreground">{new Date(g.grade_date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · coef. {fmt(g.coefficient)}</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{fmt(g.value)}/{fmt(g.max_value)}</p>
                      <button onClick={() => remove(g)} aria-label="Supprimer" className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted md:opacity-0 md:group-hover:opacity-100 focus:opacity-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
