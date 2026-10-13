import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles, FolderOpen, Zap, HardDrive, Calendar, Check, Loader2,
  ChevronLeft, Upload, ListTodo, MessageCircle, Link2, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const EASE = [0.4, 0, 0.2, 1] as const;
const STEPS = ["Bienvenue", "Profil", "Connexions", "Cours", "Organisation", "Prêt"];

interface Props {
  initialStep: number;
  onStep: (n: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function DesktopOnboarding({ initialStep, onStep, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), 5));
  const [ctx, setCtx] = useState({ drive: false, calendar: false, docs: 0, task: false, profile: false });

  const go = (n: number) => { setStep(n); onStep(n); };

  return (
    <div className="min-h-screen mesh-background flex items-center justify-center p-10">
      <div className="w-full max-w-5xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10 px-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={cn("h-1 rounded-full transition-colors duration-500", i <= step ? "bg-primary" : "bg-muted")} />
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-3 shrink-0">{step + 1} / {STEPS.length}</span>
        </div>

        <div className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="grid grid-cols-1 lg:grid-cols-2"
            >
              {/* Left: content */}
              <div className="p-10 lg:p-14 flex flex-col min-h-[520px]">
                {step === 0 && <StepWelcome onStart={() => go(1)} onSkip={onSkip} />}
                {step === 1 && <StepProfile onDone={(filled) => { setCtx((c) => ({ ...c, profile: filled })); go(2); }} />}
                {step === 2 && <StepConnect ctx={ctx} setCtx={setCtx} onDone={() => go(3)} />}
                {step === 3 && <StepImport ctx={ctx} setCtx={setCtx} onDone={() => go(4)} />}
                {step === 4 && <StepOrganize ctx={ctx} setCtx={setCtx} onDone={() => go(5)} />}
                {step === 5 && <StepReady ctx={ctx} onComplete={onComplete} />}

                {step > 0 && step < 5 && (
                  <div className="mt-auto pt-8 flex items-center gap-3">
                    <button onClick={() => go(step - 1)} className="h-11 px-5 rounded-xl text-sm text-muted-foreground hover:bg-muted flex items-center gap-1.5">
                      <ChevronLeft className="w-4 h-4" /> Précédent
                    </button>
                    <button onClick={() => go(step + 1)} className="h-11 px-5 rounded-xl text-sm text-muted-foreground hover:bg-muted ml-auto">
                      Passer cette étape
                    </button>
                  </div>
                )}
              </div>

              {/* Right: visual */}
              <div className="hidden lg:flex items-center justify-center bg-muted/30 p-14">
                <StepVisual step={step} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- Visual panel ---------- */
function StepVisual({ step }: { step: number }) {
  const icons = [Sparkles, MessageCircle, Link2, Upload, ListTodo, Rocket];
  const Icon = icons[step];
  return (
    <motion.div
      key={step}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <div className="w-28 h-28 rounded-[2rem] bg-primary/10 flex items-center justify-center">
        <Icon className="w-12 h-12 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground max-w-[220px]">
        {["Tout ta vie étudiante, au même endroit.",
          "Orbit s'adapte à toi, pas l'inverse.",
          "Tes outils restent chez toi — Orbit se connecte en lecture seule.",
          "Tes documents sont rangés automatiquement par matière.",
          "Chaque tâche créée ici apparaît dans ton tableau de bord.",
          "Ton assistant est prêt à t'accompagner toute l'année."][step]}
      </p>
    </motion.div>
  );
}

/* ---------- Step 1 : Welcome ---------- */
function StepWelcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col flex-1">
      <h1 className="text-4xl font-bold tracking-tight">Bienvenue dans ton Orbit ✨</h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        Tes cours, ton emploi du temps, tes tâches et tes objectifs. Tout au même endroit, avec une IA qui t'accompagne.
      </p>
      <div className="mt-10 space-y-5">
        {[
          { icon: Sparkles, title: "Comprendre", desc: "Orbit t'aide à apprendre et comprendre tes cours." },
          { icon: FolderOpen, title: "Organiser", desc: "Orbit centralise tes documents, échéances et priorités." },
          { icon: Zap, title: "Agir", desc: "Orbit t'aide à avancer et réalise les actions autorisées." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-10 space-y-3">
        <button onClick={onStart} className="w-full h-13 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          Configurer mon Orbit
        </button>
        <button onClick={onSkip} className="w-full h-11 rounded-2xl text-sm text-muted-foreground hover:bg-muted transition-colors">
          Passer pour le moment
        </button>
      </div>
    </div>
  );
}

/* ---------- Step 2 : Profile ---------- */
function StepProfile({ onDone }: { onDone: (filled: boolean) => void }) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!user?.id || loaded.current) return;
    loaded.current = true;
    supabase.from("profiles").select("display_name, school_level, preferences").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setFirstName(data.display_name ?? "");
        setSchool((data.preferences as Record<string, string> | null)?.school ?? "");
        setYear(data.school_level ?? "");
        setGoal((data.preferences as Record<string, string> | null)?.goal ?? "");
      });
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { data: current } = await supabase.from("profiles").select("preferences").eq("user_id", user.id).maybeSingle();
    const preferences = { ...((current?.preferences as Record<string, unknown> | null) ?? {}), school, goal };
    const { error } = await supabase.from("profiles").update({
      display_name: firstName || null,
      school_level: year || null,
      preferences,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Impossible d'enregistrer le profil."); return; }
    onDone(!!(firstName || school || year || goal));
  };

  const field = "w-full h-12 px-4 rounded-xl bg-muted/50 text-sm outline-none focus:ring-2 ring-primary/30 transition-shadow placeholder:text-muted-foreground";

  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-3xl font-bold tracking-tight">Faisons connaissance</h2>
      <p className="text-muted-foreground mt-3">Tout est facultatif — tu pourras compléter plus tard dans les réglages.</p>
      <div className="mt-8 space-y-4">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className={field} />
        <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Établissement" className={field} />
        <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Année d'étude (ex. L2, M1…)" className={field} />
        <div>
          <p className="text-sm font-medium mb-2">Ton objectif principal</p>
          <div className="flex flex-wrap gap-2">
            {["Réussir mes examens", "Mieux m'organiser", "Gagner du temps", "Autre"].map((g) => (
              <button key={g} onClick={() => setGoal(goal === g ? "" : g)}
                className={cn("h-10 px-4 rounded-full text-sm font-medium transition-colors",
                  goal === g ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted")}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <button onClick={save} disabled={saving} className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Continuer
        </button>
      </div>
    </div>
  );
}

/* ---------- Step 3 : Connections ---------- */
type ConnStatus = "idle" | "connecting" | "connected" | "error";

function StepConnect({ ctx, setCtx, onDone }: {
  ctx: { drive: boolean; calendar: boolean };
  setCtx: React.Dispatch<React.SetStateAction<any>>;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [drive, setDrive] = useState<ConnStatus>("idle");
  const [icalUrl, setIcalUrl] = useState("");
  const [cal, setCal] = useState<ConnStatus>("idle");

  // Pre-check existing connections — never redo a granted authorization.
  useEffect(() => {
    if (!user?.id) return;
    supabase.functions.invoke("google-drive", { body: { action: "status" } })
      .then(({ data }) => { if (data?.connected) { setDrive("connected"); setCtx((c: any) => ({ ...c, drive: true })); } })
      .catch(() => null);
    supabase.from("user_settings").select("ical_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.ical_url) { setIcalUrl(data.ical_url); setCal("connected"); setCtx((c: any) => ({ ...c, calendar: true })); } });
  }, [user?.id]);

  const connectDrive = async () => {
    const popup = window.open("", "orbit-drive", "width=600,height=720");
    if (!popup) { toast.error("Autorise les fenêtres pop-up puis réessaie."); return; }
    setDrive("connecting");
    try {
      const { data, error } = await supabase.functions.invoke("google-drive", { body: { action: "start", origin: window.location.origin } });
      if (error) throw new Error("Google Drive ne répond pas.");
      await new Promise<void>((resolve, reject) => {
        const onMsg = (e: MessageEvent) => {
          if (e.origin !== window.location.origin || e.source !== popup || e.data?.connectorId !== "google_drive") return;
          window.removeEventListener("message", onMsg);
          if (e.data.type === "appUserConnectorOAuthComplete") resolve();
          else reject(new Error(e.data.reason ?? "Connexion refusée."));
        };
        const poll = window.setInterval(() => { if (popup.closed) { cleanup(); reject(new Error("Fenêtre fermée avant la fin.")); } }, 500);
        const cleanup = () => { window.removeEventListener("message", onMsg); clearInterval(poll); };
        window.addEventListener("message", onMsg);
      });
      setDrive("connected");
      setCtx((c: any) => ({ ...c, drive: true }));
      toast.success("Google Drive connecté");
    } catch (e: any) {
      popup.close();
      setDrive("error");
      toast.error(e.message);
    }
  };

  const connectCalendar = async () => {
    const url = icalUrl.trim().replace(/^webcal:\/\//, "https://");
    if (!/^https:\/\/.+/.test(url)) { toast.error("Colle un lien iCal valide (https://…)."); return; }
    if (!user?.id) return;
    setCal("connecting");
    const { error } = await supabase.from("user_settings").update({ ical_url: url, sync_enabled: true }).eq("user_id", user.id);
    if (error) { setCal("error"); toast.error("Impossible d'enregistrer le calendrier."); return; }
    supabase.functions.invoke("sync-calendar", { body: {} }).catch(() => null);
    setCal("connected");
    setCtx((c: any) => ({ ...c, calendar: true }));
    toast.success("Calendrier connecté — synchronisation en cours");
  };

  const badge = (s: ConnStatus) => (
    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full",
      s === "connected" ? "bg-success/15 text-success" :
      s === "connecting" ? "bg-primary/10 text-primary" :
      s === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
      {s === "connected" ? "Connecté" : s === "connecting" ? "Connexion…" : s === "error" ? "Erreur" : "Non connecté"}
    </span>
  );

  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-3xl font-bold tracking-tight">Connecte ton univers étudiant</h2>
      <p className="text-muted-foreground mt-3">Orbit devient plus utile lorsqu'il peut retrouver tes documents et comprendre ton planning.</p>

      <div className="mt-8 space-y-4">
        {/* Google Drive */}
        <div className="rounded-2xl bg-muted/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><HardDrive className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Google Drive</p>
              <p className="text-xs text-muted-foreground">Retrouve tes cours et tes documents directement dans Orbit.</p>
            </div>
            {badge(drive)}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Autorisation demandée : lecture de tes fichiers, uniquement pour les importer dans ta bibliothèque.</p>
          {drive !== "connected" && (
            <button onClick={connectDrive} disabled={drive === "connecting"}
              className="mt-3 h-10 px-5 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {drive === "connecting" && <Loader2 className="w-4 h-4 animate-spin" />}
              {drive === "error" ? "Réessayer" : "Connecter"}
            </button>
          )}
        </div>

        {/* Calendar iCal */}
        <div className="rounded-2xl bg-muted/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Emploi du temps (iCal)</p>
              <p className="text-xs text-muted-foreground">Centralise tes événements et garde tes échéances à portée de main.</p>
            </div>
            {badge(cal)}
          </div>
          {cal !== "connected" && (
            <div className="mt-3 flex gap-2">
              <input value={icalUrl} onChange={(e) => setIcalUrl(e.target.value)} placeholder="Lien iCal de ton emploi du temps (https://…)"
                className="flex-1 h-10 px-4 rounded-xl bg-card text-sm outline-none focus:ring-2 ring-primary/30 placeholder:text-muted-foreground" />
              <button onClick={connectCalendar} disabled={cal === "connecting" || !icalUrl.trim()}
                className="h-10 px-5 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-2 disabled:opacity-60">
                {cal === "connecting" && <Loader2 className="w-4 h-4 animate-spin" />} Connecter
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button onClick={onDone} className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm">Continuer</button>
        <button onClick={onDone} className="h-12 px-6 rounded-2xl text-sm text-muted-foreground hover:bg-muted">Continuer sans connecter</button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">Tu pourras tout connecter plus tard depuis les réglages.</p>
    </div>
  );
}

/* ---------- Step 4 : Import ---------- */
function StepImport({ ctx, setCtx, onDone }: {
  ctx: { drive: boolean; docs: number };
  setCtx: React.Dispatch<React.SetStateAction<any>>;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [folderBusy, setFolderBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const importPdfs = async (files: FileList | null) => {
    if (!files?.length || !user?.id) return;
    const pdfs = Array.from(files).filter((f) => f.type.includes("pdf") && f.size <= 20 * 1024 * 1024);
    if (!pdfs.length) { toast.error("Choisis un PDF de moins de 20 Mo."); return; }
    setImporting(true);
    let ok = 0;
    for (const file of pdfs.slice(0, 5)) {
      try {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
        const { error: upErr } = await supabase.storage.from("notes").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = await supabase.storage.from("notes").createSignedUrl(path, 60 * 60 * 24 * 365);
        const { error: dbErr } = await supabase.from("vault_files").insert({
          user_id: user.id,
          file_url: urlData?.signedUrl || "",
          original_filename: file.name,
          file_type: "pdf",
          filing_status: "pending",
          tags: ["pdf"],
        });
        if (dbErr) throw dbErr;
        ok++;
      } catch (e) { console.error("Import error:", file.name, e); }
    }
    setImporting(false);
    setImported((n) => n + ok);
    setCtx((c: any) => ({ ...c, docs: c.docs + ok }));
    if (ok) toast.success(`${ok} document${ok > 1 ? "s" : ""} importé${ok > 1 ? "s" : ""} — Orbit les rangera par matière.`);
    else toast.error("L'import a échoué. Réessaie.");
  };

  const pickDriveFolder = async () => {
    setFolderBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-drive", { body: { action: "syncNow" } });
      if (error) throw new Error("Google Drive ne répond pas.");
      const n = data?.imported ?? 0;
      setImported((v) => v + n);
      setCtx((c: any) => ({ ...c, docs: c.docs + n }));
      toast.success(n ? `${n} document${n > 1 ? "s" : ""} ajouté${n > 1 ? "s" : ""} depuis Drive` : "Ton Drive est déjà à jour");
    } catch (e: any) { toast.error(e.message); }
    finally { setFolderBusy(false); }
  };

  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-3xl font-bold tracking-tight">Donne à Orbit les bonnes informations</h2>
      <p className="text-muted-foreground mt-3">Importe un premier document : Orbit le rangera automatiquement dans la bonne matière.</p>

      <div className="mt-8 space-y-4">
        <button onClick={() => inputRef.current?.click()} disabled={importing}
          className="w-full rounded-2xl border-2 border-dashed border-border p-8 text-center hover:bg-muted/30 transition-colors disabled:opacity-60">
          {importing ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /> : <Upload className="w-6 h-6 mx-auto text-muted-foreground" />}
          <p className="text-sm font-medium mt-3">{importing ? "Import en cours…" : "Importer un document PDF"}</p>
          <p className="text-xs text-muted-foreground mt-1">Jusqu'à 5 fichiers, 20 Mo chacun</p>
        </button>
        <input ref={inputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => importPdfs(e.target.files)} />

        {ctx.drive && (
          <button onClick={pickDriveFolder} disabled={folderBusy}
            className="w-full rounded-2xl bg-muted/30 p-5 flex items-center gap-4 hover:bg-muted/50 transition-colors disabled:opacity-60 text-left">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {folderBusy ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <HardDrive className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <p className="font-semibold text-sm">Synchroniser mon dossier Drive</p>
              <p className="text-xs text-muted-foreground">Importe les documents du dossier que tu as choisi.</p>
            </div>
          </button>
        )}

        {imported > 0 && (
          <p className="text-sm text-success flex items-center gap-2"><Check className="w-4 h-4" /> {imported} document{imported > 1 ? "s" : ""} dans ta bibliothèque</p>
        )}
      </div>

      <div className="mt-8">
        <button onClick={onDone} className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm">Continuer</button>
      </div>
    </div>
  );
}

/* ---------- Step 5 : First organization ---------- */
function StepOrganize({ ctx, setCtx, onDone }: {
  ctx: { task: boolean };
  setCtx: React.Dispatch<React.SetStateAction<any>>;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);

  const addTask = async () => {
    const t = title.trim();
    if (!t || !user?.id) return;
    setBusy(true);
    const due = new Date(); due.setHours(23, 59, 0, 0);
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id, title: t, priority_score: 60, energy_level: "medium", due_date: due.toISOString(),
    });
    setBusy(false);
    if (error) { toast.error("Impossible de créer la tâche."); return; }
    setCreated(true);
    setCtx((c: any) => ({ ...c, task: true }));
    toast.success("Tâche créée — elle t'attend dans ton tableau de bord");
  };

  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-3xl font-bold tracking-tight">Reprends le contrôle de ta semaine</h2>
      <p className="text-muted-foreground mt-3">Ajoute ta première tâche — elle apparaîtra immédiatement dans ton tableau de bord.</p>

      <div className="mt-8">
        {created ? (
          <div className="rounded-2xl bg-success/10 p-5 flex items-center gap-3">
            <Check className="w-5 h-5 text-success" />
            <p className="text-sm font-medium">« {title} » est enregistrée pour aujourd'hui.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="flex gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Réviser le chapitre 3 de biologie"
              className="flex-1 h-12 px-4 rounded-xl bg-muted/50 text-sm outline-none focus:ring-2 ring-primary/30 placeholder:text-muted-foreground" />
            <button type="submit" disabled={busy || !title.trim()}
              className="h-12 px-6 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Ajouter
            </button>
          </form>
        )}
      </div>

      <div className="mt-8">
        <button onClick={onDone} className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm">Continuer</button>
      </div>
    </div>
  );
}

/* ---------- Step 6 : Ready ---------- */
function StepReady({ ctx, onComplete }: { ctx: any; onComplete: () => void }) {
  const rows = [
    { ok: ctx.profile, label: ctx.profile ? "Profil configuré" : "Profil à compléter plus tard" },
    { ok: ctx.drive || ctx.calendar, label: ctx.drive && ctx.calendar ? "Drive et calendrier connectés" : ctx.drive ? "Google Drive connecté" : ctx.calendar ? "Calendrier connecté" : "Aucune application connectée" },
    { ok: ctx.docs > 0, label: ctx.docs > 0 ? `${ctx.docs} document${ctx.docs > 1 ? "s" : ""} importé${ctx.docs > 1 ? "s" : ""}` : "Aucun document importé" },
    { ok: ctx.task, label: ctx.task ? "Première tâche créée" : "Aucune tâche créée" },
  ];
  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-3xl font-bold tracking-tight">Ton espace est prêt 🚀</h2>
      <div className="mt-8 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-sm">
            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", r.ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className={r.ok ? "font-medium" : "text-muted-foreground"}>{r.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <p className="text-sm font-medium mb-3">Essaie Orbit AI dès maintenant :</p>
        <div className="flex flex-wrap gap-2">
          {["Organise ma semaine", "Aide-moi à réviser mon prochain examen", "Quelles sont mes priorités ?"].map((q) => (
            <button key={q} onClick={() => { sessionStorage.setItem("orbit_ai_prompt", q); onComplete(); }}
              className="h-10 px-4 rounded-full bg-muted/60 text-sm font-medium hover:bg-muted transition-colors">
              {q}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-auto pt-10">
        <button onClick={onComplete} className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          Accéder à mon Orbit
        </button>
      </div>
    </div>
  );
}
