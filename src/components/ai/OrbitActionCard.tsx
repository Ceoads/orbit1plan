import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Undo2 } from "lucide-react";
import { OrbitSpinner } from "@/components/ui/orbit-spinner";
import { supabase } from "@/integrations/supabase/client";
import type { OrbitActionOp } from "@/lib/orbitAction";

// Session memory: a confirmed/cancelled card never comes back as actionable.
const settled = new Map<string, string>();

const fallbackLabel = (op: OrbitActionOp) =>
  op.type === "file_document" ? "Ranger ce document ?" : op.type === "create_task" ? `Créer le devoir « ${op.title} » ?` : op.type === "complete_task" ? "Marquer ce devoir comme terminé ?" : "Supprimer cet élément ?";

export function OrbitActionCard({ op }: { op: OrbitActionOp }) {
  const key = JSON.stringify(op);
  const qc = useQueryClient();
  const [state, setState] = useState<string | null>(settled.get(key) ?? null);
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<unknown>(null);

  const run = async (body: unknown, after: (msg: string, undo?: unknown) => void) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("orbit-ai", { body: { action: "execute", op: body } });
    setBusy(false);
    if (error || !data?.ok) { setState(data?.error ?? "Action impossible."); return; }
    qc.invalidateQueries();
    after(data.message, data.undo);
  };
  const confirm = () => { const { label: _l, ...clean } = op; void run(clean, (m, u) => { settled.set(key, m); setState(m); setUndo(u ?? null); }); };
  const cancel = () => { settled.set(key, "Annulé — rien n'a changé."); setState("Annulé — rien n'a changé."); };
  const revert = () => void run(undo, (m) => { settled.set(key, m); setState(m); setUndo(null); });
  const danger = op.type === "delete_item";

  return (
    <div className="mt-4 rounded-2xl bg-card p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
      <p className="text-sm font-medium">{String(op.label ?? fallbackLabel(op))}</p>
      {state ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Check className="w-4 h-4 text-primary" /> <span className="flex-1">{state}</span>
          {undo && <button onClick={revert} disabled={busy} className="h-11 px-4 rounded-full flex items-center gap-1.5 hover:bg-muted"><Undo2 className="w-4 h-4" /> Annuler</button>}
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={confirm} disabled={busy} className={`h-11 px-5 rounded-full text-sm font-semibold flex items-center gap-2 ${danger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
            {busy && <OrbitSpinner className="w-4 h-4 text-current" />} Confirmer
          </button>
          <button onClick={cancel} disabled={busy} className="h-11 px-5 rounded-full text-sm text-muted-foreground hover:bg-muted">Annuler</button>
        </div>
      )}
    </div>
  );
}
