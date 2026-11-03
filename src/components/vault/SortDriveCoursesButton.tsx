import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Quiet button: lets the AI file every Drive course without a subject, page by page. */
export const SortDriveCoursesButton = ({ onDone, className }: { onDone: () => void; className?: string }) => {
  const [progress, setProgress] = useState<number | null>(null);
  const run = async () => {
    setProgress(0);
    let filed = 0, ambiguous = 0, semestersUpdated = 0, seen = 0;
    let after: string | undefined;
    try {
      for (let i = 0; i < 200; i++) {
        const { data, error } = await supabase.functions.invoke("google-drive", { body: { action: "autoFile", ...(after ? { after } : {}) } });
        if (error || data?.error) throw new Error(data?.error || "Le rangement a échoué. Réessaie.");
        filed += data.filed ?? 0; ambiguous += data.ambiguous ?? 0; seen += data.total ?? 0;
        semestersUpdated += data.semestersUpdated ?? 0;
        setProgress(seen);
        if (!data.nextCursor) break;
        after = data.nextCursor;
      }
      onDone();
      const details = [
        ambiguous ? `${ambiguous} cours encore sans matière · à classer à la main` : "",
        semestersUpdated ? `${semestersUpdated} semestre${semestersUpdated > 1 ? "s" : ""} mis à jour` : "",
      ].filter(Boolean).join(" · ");
      if (filed > 0) toast.success(`${filed} cours rangé${filed > 1 ? "s" : ""} dans une matière`, { description: details || undefined });
      else if (ambiguous > 0) toast.warning("Aucun cours rangé dans une matière", { description: details });
      else if (semestersUpdated > 0) toast("Semestres mis à jour", { description: "Aucun nouveau cours rangé dans une matière." });
      else toast("Aucun cours Drive à ranger", { description: "Aucun document Drive importé ne nécessite de classement." });
    } catch (e: any) {
      toast.error(e?.message || "Le rangement a échoué. Réessaie.");
    } finally { setProgress(null); }
  };
  const busy = progress !== null;
  return (
    <Button variant="ghost" size="sm" type="button" onClick={run} disabled={busy} aria-label="Ranger mes cours Drive avec l'IA"
      className={cn("min-h-[36px] px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center gap-1.5 transition-colors disabled:opacity-60", className)}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
      {busy ? `Analyse ${progress}…` : "Ranger mes cours Drive"}
    </Button>
  );
};
