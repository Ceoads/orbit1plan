import { useState } from "react";
import { CalendarDays, Check, FileText, LayoutGrid, MessageCircle, Mic, Sparkles, ArrowUp, FolderOpen, Monitor, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitCompanion } from "@/components/ai/OrbitCompanion";

const views = [
  { id: "pulse", label: "Ma journée", icon: CalendarDays },
  { id: "vault", label: "Mes cours", icon: FolderOpen },
  { id: "ai", label: "Orbit AI", icon: MessageCircle },
] as const;

/** A local, illustrative product preview; never writes student data or calls AI. */
export function LandingWorkspace() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("pulse");
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-elevated border border-border/40">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 px-5 py-4 sm:px-8">
        <span className="flex items-center gap-2 font-semibold"><LayoutGrid className="h-4 w-4 text-accent-foreground" /> Mon espace Orbit</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><Monitor className="hidden h-4 w-4 lg:block" /><span className="hidden lg:inline">Version ordinateur ·</span> Aperçu · données d’exemple</span>
      </div>
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)]">
      <div role="tablist" aria-label="Aperçu des fonctionnalités" className="flex gap-1 p-3 sm:px-8 lg:flex-col lg:gap-2 lg:border-r lg:border-border/40 lg:bg-secondary/40 lg:px-4 lg:py-8">
        <div className="mb-7 hidden px-3 lg:block"><p className="text-xl font-bold">Orbit</p><p className="mt-1 text-xs text-muted-foreground">Ton espace étudiant</p></div>
        {views.map(({ id, label, icon: Icon }) => (
          <Button key={id} id={`preview-tab-${id}`} role="tab" aria-selected={view === id} aria-controls={`preview-panel-${id}`} tabIndex={view === id ? 0 : -1}
            onClick={() => setView(id)} onKeyDown={(event) => {
              if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;
              event.preventDefault();
              const index = views.findIndex(item => item.id === view);
              const next = views[(index + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : 2)) % views.length];
              setView(next.id);
              document.getElementById(`preview-tab-${next.id}`)?.focus();
            }} variant="ghost" className={`min-h-11 flex-1 rounded-xl sm:flex-none lg:justify-start lg:px-3 ${view === id ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
            <Icon className="hidden sm:block" />{label}
          </Button>
        ))}
        <div className="mt-auto hidden px-3 pt-12 text-xs text-muted-foreground lg:block"><div className="mb-3 flex items-center gap-2"><CloudStatus /> Tout est à jour</div>Un espace pour ton semestre.</div>
      </div>
      <div id={`preview-panel-${view}`} role="tabpanel" aria-labelledby={`preview-tab-${view}`} className="min-w-0 min-h-[360px] p-5 pt-3 sm:p-8 sm:pt-4 lg:min-h-[480px] lg:p-8">
        {view === "pulse" && <><div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Lundi 19 octobre</p>
            <h3 className="mt-1 text-2xl font-bold">Une journée bien à toi.</h3>
            <div className="mt-6 rounded-2xl bg-accent p-5">
              <p className="text-xs font-medium text-accent-foreground">PROCHAIN COURS</p>
              <h4 className="mt-3 text-lg font-bold">Marketing digital</h4>
              <p className="mt-2 text-sm text-muted-foreground">14:00 – 15:30 · Salle 204</p>
            </div>
          </div>
          <div className="sm:pt-2">
            <p className="mb-3 text-sm font-semibold">Le programme du jour</p>
            {["Relire le chapitre 3", "Préparer le TD d’économie", "Réviser les flashcards"].map((task, index) => <div key={task} className="flex items-center gap-3 border-b border-border/40 py-4 text-sm">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${index === 0 ? "bg-success/15 text-success" : "border border-border"}`}>{index === 0 && <Check className="h-4 w-4" />}</span>
              <span className={index === 0 ? "text-muted-foreground line-through" : ""}>{task}</span>
            </div>)}
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" /> Calendrier universitaire synchronisé</p>
          </div>
        </div><div className="mt-8 hidden grid-cols-[1fr_180px] gap-8 border-t border-border/40 pt-6 lg:grid"><div><p className="flex items-center gap-2 text-sm font-semibold"><NotebookPen className="h-4 w-4 text-accent-foreground" /> Mon bloc-notes du jour</p><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Revoir les exemples du cours avant le TD.<br />Demander à Orbit un quiz sur le chapitre 3.</p></div><div><p className="text-sm font-semibold">Cette semaine</p><div className="mt-4 grid grid-cols-5 gap-1 text-center">{["L", "M", "M", "J", "V"].map((day, index) => <div key={index} className={`rounded-xl py-2 ${index === 0 ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}><p className="text-xs">{day}</p><p className="mt-1 text-sm font-semibold">{19 + index}</p></div>)}</div></div></div></>}
        {view === "vault" && <div>
          <p className="text-sm text-muted-foreground">Vault</p><h3 className="mt-1 text-2xl font-bold">Chaque cours à sa place.</h3>
          <div className="mt-6 divide-y divide-border/40">
            {[{ title: "Marketing digital", file: "Chapitre 3 · Stratégie de marque.pdf" }, { title: "Économie", file: "TD 4 · Offre et demande.pdf" }, { title: "Droit", file: "Introduction au droit.pdf" }].map(item => <div key={item.title} className="flex items-center gap-4 py-4">
              <FileText className="h-6 w-6 shrink-0 text-accent-foreground" />
              <div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-1 truncate text-sm text-muted-foreground">{item.file}</p></div>
              <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Sparkles className="h-3 w-3" /> Classé par l’IA</span>
            </div>)}
          </div>
        </div>}
        {view === "ai" && <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-4"><OrbitCompanion size={58} /><div><h3 className="text-xl font-bold">Ton prof perso.</h3><p className="text-sm text-muted-foreground">Avec tes cours comme point de départ.</p></div></div>
          <div className="mt-5 ml-auto max-w-[85%] rounded-2xl bg-secondary p-4 text-sm">Explique-moi l’offre et la demande simplement.</div>
          <div className="mt-5 flex gap-3"><Sparkles className="mt-1 h-4 w-4 shrink-0 text-accent-foreground" /><p className="text-sm leading-relaxed">Imagine un concert : plus les places sont rares et les fans nombreux, plus le prix peut monter. L’offre, ce sont les places disponibles ; la demande, les personnes qui les veulent.</p></div>
          <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-4 text-muted-foreground"><Mic className="h-4 w-4" /><span className="flex-1 text-sm">Une autre question ?</span><ArrowUp className="h-4 w-4" /></div>
        </div>}
      </div>
      </div>
    </div>
  );
}

function CloudStatus() {
  return <Check className="h-3 w-3 text-success" />;
}