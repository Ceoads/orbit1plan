import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Quiet button: lets the AI file every Drive course without a subject, page by page. */
export const SortDriveCoursesButton = ({ onDone, className }: { onDone: () => void; className?: string }) => {
  const [progress, setProgress] = useState<number | null>(null);
  const run = async () => {
    setProgress(0);
    let filed = 0, ambiguous = 0, seen = 0;
    let after: string | undefined;
    try {
      for (let i = 0; i < 200; i++) {
        const { data, error } = await supabase.functions.invoke("google-drive", { body: { action: "autoFile", ...(after ? { after } : {}) } });
        if (error || data?.error) throw new Error(data?.error || "Le rangement a échoué. Réessaie.");
        filed += data.filed ?? 0; ambiguous += data.ambiguous ?? 0; seen += data.total ?? 0;
        setProgress(seen);
        if (!data.nextCursor) break;
        after = data.nextCursor;
      }
      onDone();
      if (!seen) toast("Tout est déjà rangé", { description: "Aucun cours Drive sans matière." });
      else toast.success(`${filed} cours rangé${filed > 1 ? "s" : ""}${ambiguous ? ` · ${ambiguous} à classer à la main` : ""}`);
    } catch (e: any) {
      toast.error(e?.message || "Le rangement a échoué. Réessaie.");
    } finally { setProgress(null); }
  };
  const busy = progress !== null;
  return (
    <button type="button" onClick={run} disabled={busy} aria-label="Ranger mes cours Drive avec l'IA"
      className={cn("min-h-[36px] px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center gap-1.5 transition-colors disabled:opacity-60", className)}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
      {busy ? `Analyse ${progress}…` : "Ranger mes cours Drive"}
    </button>
  );
};
