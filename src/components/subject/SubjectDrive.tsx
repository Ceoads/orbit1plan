import { confirmAction } from "@/components/ConfirmHost";
import { useEffect, useState } from "react";
import { Search, FileText, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PdfPagesViewer } from "@/components/study-hub/PdfPagesViewer";
import type { VaultFile } from "@/hooks/useVaultData";

interface DriveFile { id: string; name: string; mimeType: string; size?: string; modifiedTime: string }

const callDrive = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("google-drive", { body });
  if (error) {
    let msg = "Google Drive ne répond pas.";
    try { msg = JSON.parse(await (error as any).context.text()).error || msg; } catch { /* ignore */ }
    throw new Error(typeof msg === "string" ? msg : "Requête invalide");
  }
  return data;
};
const typeLabel = (m: string) => m.includes("google-apps") ? "Google Doc" : m.includes("pdf") ? "PDF" : "Word";
const fmtSize = (s?: string) => !s ? "—" : Number(s) > 1e6 ? `${(Number(s) / 1e6).toFixed(1)} Mo` : `${Math.max(1, Math.round(Number(s) / 1e3))} Ko`;
const fileName = (f: VaultFile) => f.original_filename || f.ai_summary?.slice(0, 40) || "Document sans titre";

export function DocReader({ file, onClose }: { file: VaultFile | null; onClose: () => void }) {
  const isPdf = !!file && (file.file_type === "pdf" || /\.pdf($|\?)/i.test(file.original_filename || file.file_url));
  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 rounded-3xl overflow-hidden flex flex-col gap-0">
        <DialogHeader className="px-8 py-5 border-b border-border/40">
          <DialogTitle className="truncate pr-8">{file ? fileName(file) : ""}</DialogTitle>
          <DialogDescription className="sr-only">Lecture du document</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {file && (isPdf ? <PdfPagesViewer fileUrl={file.file_url} />
            : file.file_type === "photo" ? <img src={file.file_url} alt="" className="mx-auto rounded-2xl max-w-full" />
            : file.extracted_text ? <p className="whitespace-pre-wrap text-sm leading-relaxed bg-card rounded-2xl p-8">{file.extracted_text}</p>
            : <div className="text-center py-24 space-y-4"><p className="text-muted-foreground">Aperçu indisponible pour ce format.</p>
                <a href={file.file_url} target="_blank" rel="noreferrer" className="inline-flex h-11 px-5 items-center rounded-2xl bg-foreground text-background text-sm font-medium">Télécharger</a></div>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SubjectDriveDialog({ open, onOpenChange, subjectId, subjectName, unfiled, onFile, onImported }: {
  open: boolean; onOpenChange: (o: boolean) => void; subjectId: string; subjectName: string;
  unfiled: VaultFile[]; onFile: (fileId: string) => Promise<boolean>; onImported: () => void;
}) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState<Record<string, "loading" | "done">>({});
  const unfiledDrive = unfiled.filter((f) => !f.subject_id && f.tags?.includes("drive"));

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const d = await callDrive({ action: "list", search: search || undefined, type: "all" });
        setConnected(!!d.connected); setFiles(d.files ?? []);
      } catch (e: any) { toast.error(e.message); setConnected(false); } finally { setBusy(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [open, search]);

  const importFile = async (f: DriveFile) => {
    setImporting((s) => ({ ...s, [f.id]: "loading" }));
    try {
      const d = await callDrive({ action: "import", fileId: f.id, subjectId });
      if (d.reconnectRequired) throw new Error("Ton accès Google Drive doit être renouvelé.");
      setImporting((s) => ({ ...s, [f.id]: "done" }));
      toast.success(`« ${d.name} » rangé dans ${subjectName}`);
      onImported();
    } catch (e: any) {
      setImporting((s) => { const n = { ...s }; delete n[f.id]; return n; });
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <DialogHeader>
          <DialogTitle>Ajouter depuis Google Drive</DialogTitle>
          <DialogDescription>Les documents choisis sont copiés et rangés dans {subjectName}.</DialogDescription>
        </DialogHeader>
        {unfiledDrive.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Déjà importés, sans matière</p>
            {unfiledDrive.slice(0, 6).map((f) => (
              <div key={f.id} className="flex items-center gap-3 bg-muted/40 rounded-2xl px-4 py-3">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="flex-1 truncate text-sm">{fileName(f)}</span>
                <button onClick={async () => { if (!(await confirmAction({ title: `Ranger ce document dans ${subjectName} ?`, description: fileName(f), confirmLabel: "Ranger", destructive: false }))) return; if (await onFile(f.id)) toast.success("Rangé"); }}
                  className="h-10 px-4 rounded-xl bg-foreground text-background text-xs font-medium">Ranger ici</button>
              </div>
            ))}
          </div>
        )}
        {connected === false ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Connecte d'abord ton Google Drive depuis la version ordinateur, onglet « Google Drive ».</p>
        ) : (
          <>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans ton Drive…"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-muted/50 outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
            <div className="flex-1 overflow-y-auto -mx-2 min-h-[200px]">
              {busy && <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
              {!busy && files.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Aucun document trouvé.</p>}
              {!busy && files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-2 py-3">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{typeLabel(f.mimeType)} · {fmtSize(f.size)}</p>
                  </div>
                  <button disabled={!!importing[f.id]} onClick={() => importFile(f)}
                    className="h-10 px-4 rounded-xl text-xs font-medium bg-primary text-primary-foreground disabled:opacity-60 min-w-[96px] flex items-center justify-center gap-1">
                    {importing[f.id] === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : importing[f.id] === "done" ? <><Check className="w-3.5 h-3.5" /> Ajouté</> : "Ajouter"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
