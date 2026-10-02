import { confirmAction } from "@/components/ConfirmHost";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, NotebookPen, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendToTodayNotepad } from "@/lib/notepad";
import { cn } from "@/lib/utils";

interface Chapter { id: string; title: string; content: string; position: number }

/** Fiche de cours d'une matière : chapitres éditables, sauvegarde auto, envoi vers le bloc-notes du jour. */
export function CourseSheet({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let alive = true;
    supabase.from("course_chapters").select("id,title,content,position").eq("subject_id", subjectId).order("position")
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) toast.error("Impossible de charger la fiche");
        setChapters(data ?? []); setActive(data?.[0]?.id ?? null);
      });
    return () => { alive = false; };
  }, [subjectId]);

  const add = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("course_chapters")
      .insert({ user_id: user.id, subject_id: subjectId, title: `Chapitre ${(chapters?.length ?? 0) + 1}`, position: chapters?.length ?? 0 })
      .select("id,title,content,position").single();
    if (error) return toast.error("Création impossible");
    setChapters((c) => [...(c ?? []), data]); setActive(data.id);
  };

  const patch = (id: string, v: Partial<Chapter>) => {
    setChapters((c) => c?.map((x) => x.id === id ? { ...x, ...v } : x) ?? null);
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      supabase.from("course_chapters").update(v).eq("id", id).then(({ error }) => error && toast.error("Sauvegarde impossible"));
    }, 600);
  };

  const remove = async (id: string) => {
    if (!(await confirmAction({ title: "Supprimer ce chapitre ?", description: "Son contenu sera définitivement effacé." }))) return;
    await supabase.from("course_chapters").delete().eq("id", id);
    setChapters((c) => { const n = c?.filter((x) => x.id !== id) ?? []; setActive(n[0]?.id ?? null); return n; });
  };

  const move = (i: number, d: -1 | 1) => {
    if (!chapters) return;
    const n = [...chapters]; const j = i + d; if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    const withPos = n.map((c, k) => ({ ...c, position: k }));
    setChapters(withPos);
    withPos.forEach((c) => supabase.from("course_chapters").update({ position: c.position }).eq("id", c.id).then());
  };

  const [sending, setSending] = useState(false);
  const toNotepad = async (c: Chapter) => {
    if (!user) return;
    setSending(true);
    try { await sendToTodayNotepad(user.id, `Réviser ${subjectName} — ${c.title}`, subjectId); toast.success("Ajouté au bloc-notes du jour"); }
    catch { toast.error("Ajout impossible"); } finally { setSending(false); }
  };

  if (!chapters) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  const current = chapters.find((c) => c.id === active);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="md:w-64 shrink-0 space-y-1">
        {chapters.map((c, i) => (
          <div key={c.id} className={cn("group flex items-center rounded-2xl", active === c.id ? "bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)]" : "hover:bg-card/60")}>
            <button onClick={() => setActive(c.id)} className="flex-1 text-left px-4 py-3 min-h-[44px] text-sm font-medium truncate">
              <span className="text-muted-foreground mr-2">{i + 1}.</span>{c.title || "Sans titre"}
            </button>
            <div className="hidden group-hover:flex pr-1">
              <button aria-label="Monter" onClick={() => move(i, -1)} className="w-7 h-7 flex items-center justify-center text-muted-foreground"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button aria-label="Descendre" onClick={() => move(i, 1)} className="w-7 h-7 flex items-center justify-center text-muted-foreground"><ChevronDown className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        <button onClick={add} className="w-full flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-2xl text-sm text-primary font-medium hover:bg-card/60">
          <Plus className="w-4 h-4" /> Ajouter un chapitre
        </button>
      </aside>
      <section className="flex-1 bg-card rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[360px]">
        {!current ? (
          <div className="text-center py-16 space-y-3">
            <p className="font-semibold">Ta fiche de cours est vide</p>
            <p className="text-sm text-muted-foreground">Crée un premier chapitre pour résumer ce que tu apprends.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <input value={current.title} onChange={(e) => patch(current.id, { title: e.target.value })} placeholder="Titre du chapitre"
              className="w-full text-2xl font-bold bg-transparent outline-none" />
            <textarea value={current.content} onChange={(e) => patch(current.id, { content: e.target.value })}
              placeholder="Notions clés, définitions, formules…" rows={14}
              className="w-full bg-muted/40 rounded-2xl p-5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30 resize-y" />
            <div className="flex flex-wrap gap-3">
              <button onClick={() => toNotepad(current)} disabled={sending}
                className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-60">
                <NotebookPen className="w-4 h-4" /> Réviser aujourd'hui
              </button>
              <button onClick={() => remove(current.id)} className="h-11 px-4 rounded-2xl text-sm text-muted-foreground hover:text-destructive flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
            <p className="text-xs text-muted-foreground">« Réviser aujourd'hui » ajoute ce chapitre au bloc-notes du jour et crée la tâche correspondante.</p>
          </div>
        )}
      </section>
    </div>
  );
}
