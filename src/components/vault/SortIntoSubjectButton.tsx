import { OrbitSpinner as Loader2 } from "@/components/ui/orbit-spinner";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props { subjectId: string; subjectName: string; onDone: () => void; className?: string }

/** Small, quiet button: files every unfiled document that belongs to this subject. */
export const SortIntoSubjectButton = ({ subjectId, subjectName, onDone, className }: Props) => {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-file", { body: { action: "sortIntoSubject", subjectId } });
      if (error || data?.error) throw new Error(data?.error || "Le rangement a échoué. Réessaie.");
      const ids: string[] = data?.movedIds ?? [];
      const failed: number = data?.failed ?? 0;
      onDone();
      if (failed) toast(`${failed} document${failed > 1 ? "s n'ont" : " n'a"} pas pu être analysé${failed > 1 ? "s" : ""}`, { description: "Réessaie dans un instant." });
      if (ids.length === 0) { toast("Rien à ranger", { description: `Aucun document non classé ne concerne ${subjectName}.` }); return; }
      toast.success(`${ids.length} document${ids.length > 1 ? "s" : ""} rangé${ids.length > 1 ? "s" : ""} dans ${subjectName}`, {
        action: { label: "Annuler", onClick: async () => {
          const { error: e } = await supabase.from("vault_files").update({ subject_id: null }).in("id", ids).eq("subject_id", subjectId);
          if (e) toast.error("Annulation impossible."); else { toast("Rangement annulé"); onDone(); }
        } },
      });
    } catch (e: any) {
      toast.error(e?.message || "Le rangement a échoué. Réessaie.");
    } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={run} disabled={busy} aria-label={`Ranger les documents de ${subjectName}`}
      className={cn("min-h-[36px] px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center gap-1.5 transition-colors disabled:opacity-60", className)}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
      {busy ? "Rangement…" : "Ranger"}
    </button>
  );
};
