import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSemesterSetup } from "@/hooks/useSemesterSetup";
import { SemesterDraft, semesterSetupError } from "@/lib/semesterSetup";

export function SemesterDatesForm({ onComplete, onSkip }: { onComplete: () => void; onSkip?: () => void }) {
  const setup = useSemesterSetup();
  const [rows, setRows] = useState<SemesterDraft[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!setup.data || rows) return;
    const drafts = setup.data.map((row) => ({ ...row }));
    while (drafts.length < 2) drafts.push({ name: `Semestre ${drafts.length + 1}`, start_date: "", end_date: "" });
    setRows(drafts);
  }, [setup.data, rows]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rows) return;
    const validation = semesterSetupError(rows);
    if (validation) { setError(validation); return; }
    setSaving(true); setError(null);
    try { await setup.save(rows); toast.success("Dates des semestres enregistrées"); onComplete(); }
    catch { setError("Impossible d’enregistrer tes dates. Réessaie."); }
    finally { setSaving(false); }
  };
  if (setup.isError) return <div className="space-y-4"><p role="alert">Impossible de charger tes semestres.</p><Button onClick={() => setup.refetch()}>Réessayer</Button>{onSkip && <Button variant="ghost" onClick={onSkip}>Plus tard</Button>}</div>;
  if (!rows) return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  return <form onSubmit={save} className="space-y-6">
    <div className="space-y-6">
      {rows.map((row, index) => <fieldset key={row.id ?? index} className="space-y-3 min-w-0" disabled={saving}>
        <legend className="text-sm font-semibold mb-3">{row.name || `Semestre ${index + 1}`}</legend>
        <label className="block text-xs text-muted-foreground space-y-2"><span>Nom du semestre</span><Input aria-label={`Nom du semestre ${index + 1}`} value={row.name} maxLength={100} onChange={(e) => setRows(rows.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} className="h-11 bg-muted/40" /></label>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4">
          {(["start_date", "end_date"] as const).map((field) => <label key={field} className="block text-xs text-muted-foreground space-y-2 min-w-0">
            <span>{field === "start_date" ? "Début" : "Fin"}</span>
            <Input type="date" required aria-label={`${field === "start_date" ? "Début" : "Fin"} du semestre ${index + 1}`} value={row[field]} onChange={(e) => setRows(rows.map((item, i) => i === index ? { ...item, [field]: e.target.value } : item))} className="h-12 min-w-0 max-w-full bg-muted/40" />
          </label>)}
        </div>
      </fieldset>)}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-col gap-2">
      <Button type="submit" disabled={saving} className="h-12 rounded-xl">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer les dates</Button>
      {onSkip && <Button type="button" variant="ghost" disabled={saving} onClick={onSkip} className="h-11">Plus tard</Button>}
    </div>
  </form>;
}

export function SemesterDatesStep({ onComplete, onSkip }: { onComplete: () => void; onSkip?: () => void }) {
  return <div className="space-y-6">
    <div><CalendarDays className="w-8 h-8 text-primary mb-4" /><h2 className="text-2xl font-semibold">Ton année universitaire</h2><p className="text-sm text-muted-foreground mt-3">Quelles sont les dates de tes semestres ?</p></div>
    <SemesterDatesForm onComplete={onComplete} onSkip={onSkip} />
  </div>;
}

export function SemesterDatesPrompt({ enabled }: { enabled: boolean }) {
  const setup = useSemesterSetup();
  const [dismissed, setDismissed] = useState(false);
  return <Dialog open={enabled && setup.needsSetup && !dismissed} onOpenChange={(open) => { if (!open) setDismissed(true); }}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[85dvh] overflow-y-auto rounded-2xl p-6 sm:p-8">
      <DialogTitle className="text-2xl pr-6">Ton année universitaire</DialogTitle>
      <DialogDescription>Quelles sont les dates de tes semestres ?</DialogDescription>
      <SemesterDatesForm onComplete={() => setDismissed(true)} onSkip={() => setDismissed(true)} />
    </DialogContent>
  </Dialog>;
}