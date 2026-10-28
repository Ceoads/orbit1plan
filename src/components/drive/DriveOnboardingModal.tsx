import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ExternalLink, FolderPlus, Link2, Loader2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { parseDriveFolderLink } from "@/lib/driveFolderId";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

async function callDrive(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("google-drive", { body });
  if (error) {
    let msg = "Google Drive ne répond pas.";
    try { msg = JSON.parse(await (error as any).context.text()).error || msg; } catch { /* ignore */ }
    throw new Error(typeof msg === "string" ? msg : "Requête invalide");
  }
  return data;
}

export function DriveOnboardingModal({ open, onOpenChange, onLinked }: { open: boolean; onOpenChange: (v: boolean) => void; onLinked?: (imported: number, ids?: string[]) => void }) {
  const [step, setStep] = useState(0);
  const [botEmail, setBotEmail] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const parsed = useMemo(() => parseDriveFolderLink(link), [link]);
  const folderId = parsed?.id ?? null;
  const [result, setResult] = useState<string>("Tes cours se synchronisent chaque matin.");

  useEffect(() => {
    if (!open) return;
    setStep(0); setLink(""); setError(null); setDone(false);
    callDrive({ action: "hubInfo" }).then((d) => { setBotEmail(d.botEmail); setAvailable(!!d.available); }).catch(() => setAvailable(false));
  }, [open]);

  const copy = async () => {
    if (!botEmail) return;
    await navigator.clipboard.writeText(botEmail);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const connect = async () => {
    if (!folderId) return;
    setBusy(true); setError(null);
    try {
      const d = await callDrive({ action: "hubLink", folderId, resourceKey: parsed?.resourceKey });
      const n = d.imported ?? 0;
      const msg = n
        ? `${n} document${n > 1 ? "s" : ""} importé${n > 1 ? "s" : ""} dans ta Bibliothèque${d.remaining ? ` · ${d.remaining} de plus demain matin` : ""}.`
        : d.total ? "Tes documents étaient déjà dans ta Bibliothèque." : "Dossier vide pour l'instant : ajoute des PDF, Google Docs ou Word, Orbit les importera.";
      setResult(d.syncError || d.importError ? `${msg} Certains fichiers n'ont pas pu être importés, Orbit réessaiera demain.` : msg);
      setDone(true);
      toast.success(`« ${d.name ?? "Orbit Hub"} » relié · Orbit voit ton dossier`);
      onLinked?.(n, d.importedIds);
      setTimeout(() => onOpenChange(false), 2600);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const steps = [
    {
      icon: FolderPlus, title: "Crée ton Orbit Hub",
      text: "Pour rester organisé et privé, Orbit ne synchronise que les fichiers d'un dossier dédié.",
      body: (
        <div className="rounded-2xl bg-muted/50 p-5 text-sm text-muted-foreground space-y-3">
          <p>Ouvre Google Drive et crée un nouveau dossier nommé <span className="font-semibold text-foreground">Orbit Hub</span>.</p>
          <a href="https://drive.google.com/drive/my-drive" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary font-medium">
            Ouvrir Google Drive <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ),
      cta: "Je l'ai créé", next: () => setStep(1), disabled: false,
    },
    {
      icon: UserPlus, title: "Invite le bot de synchro",
      text: "Partage ton dossier avec le bot d'Orbit pour qu'il synchronise tes cours en arrière-plan.",
      body: (
        <div className="space-y-4">
          {available && botEmail ? (
            <div className="flex items-center gap-3 rounded-full bg-primary/10 pl-5 pr-1.5 py-1.5">
              <span className="flex-1 truncate font-mono text-sm text-foreground">{botEmail}</span>
              <button onClick={copy} className="h-11 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2">
                {copied ? <><Check className="w-4 h-4" /> Copié</> : <><Copy className="w-4 h-4" /> Copier</>}
              </button>
            </div>
          ) : (
            <p className="rounded-2xl bg-muted/50 p-5 text-sm text-muted-foreground">
              {available ? "Chargement…" : "Le bot de synchronisation n'est pas encore disponible. Utilise « Connecter Google Drive » en attendant."}
            </p>
          )}
          <p className="text-sm text-muted-foreground">Dans Drive : clic droit sur <b className="text-foreground">Orbit Hub</b> → Partager → colle l'adresse → rôle <b className="text-foreground">Éditeur</b> → Envoyer.</p>
        </div>
      ),
      cta: "Adresse ajoutée", next: () => setStep(2), disabled: !available || !botEmail,
    },
    {
      icon: Link2, title: "Colle le lien du dossier",
      text: "Copie le lien de partage de ton Orbit Hub et colle-le ci-dessous.",
      body: (
        <div className="space-y-3">
          <div className="relative">
            <input autoFocus value={link} onChange={(e) => { setLink(e.target.value); setError(null); }}
              placeholder="https://drive.google.com/drive/folders/…"
              className="w-full h-14 pl-5 pr-12 rounded-2xl bg-muted/50 outline-none focus:ring-2 focus:ring-primary/30 text-base" />
            <AnimatePresence>
              {folderId && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {link && !folderId && <p className="text-sm text-muted-foreground">Ce lien ne ressemble pas à un dossier Google Drive.</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ),
      cta: busy ? "Connexion…" : "Connecter Drive", next: connect, disabled: !folderId || busy,
    },
  ];
  const s = steps[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-0 p-10 shadow-[0_20px_60px_rgb(0,0,0,0.08)] overflow-hidden">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring}
              className="flex flex-col items-center text-center py-10 gap-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="w-10 h-10" strokeWidth={3} />
              </motion.div>
              <DialogTitle className="text-2xl font-bold">Orbit Hub relié</DialogTitle>
              <DialogDescription>{result}</DialogDescription>
            </motion.div>
          ) : (
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={spring} className="space-y-6">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <motion.span key={i} layout transition={spring} className={cn("h-1.5 rounded-full", i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted")} />
                ))}
              </div>
              <s.icon className="w-8 h-8 text-primary" />
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold tracking-tight">{s.title}</DialogTitle>
                <DialogDescription className="text-muted-foreground">{s.text}</DialogDescription>
              </div>
              {s.body}
              <div className="flex items-center gap-3 pt-2">
                {step > 0 && <button onClick={() => setStep(step - 1)} className="h-12 px-5 rounded-2xl text-sm text-muted-foreground">Retour</button>}
                <motion.button whileTap={{ scale: 0.97 }} onClick={s.next} disabled={s.disabled}
                  className="ml-auto h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-medium disabled:opacity-50 inline-flex items-center gap-2">
                  {busy && step === 2 && <Loader2 className="w-4 h-4 animate-spin" />}{s.cta}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
