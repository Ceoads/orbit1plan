import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Brain, Layers, HardDrive, Search, FileText, Image as ImageIcon,
  Loader2, ChevronLeft, ChevronRight, ChevronDown, RotateCcw, Shuffle, Check, X, CircleDashed, Sparkles, FolderOpen, Home,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVaultData, VaultFile } from "@/hooks/useVaultData";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { cn } from "@/lib/utils";
import { DesktopHome } from "@/components/desktop/DesktopHome";
import { SubjectIcon } from "@/components/SubjectIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Section = "home" | "library" | "subjects" | "quiz" | "flashcards" | "drive";

interface QuizQuestion { question: string; options: string[]; correctIndex: number; explanation: string }
interface Card { id: string; question: string; answer: string; subject_id: string | null; mastered: boolean }

const NAV: { id: Section; label: string; icon: typeof BookOpen }[] = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "library", label: "Bibliothèque", icon: BookOpen },
  { id: "subjects", label: "Par matière", icon: FolderOpen },
  { id: "quiz", label: "Quiz", icon: Brain },
  { id: "flashcards", label: "Fiches", icon: Layers },
  { id: "drive", label: "Google Drive", icon: HardDrive },
];

const fileName = (f: VaultFile) => f.original_filename || f.ai_summary?.slice(0, 40) || "Document sans titre";
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
};

export default function DesktopApp() {
  const [section, setSection] = useState<Section>("home");
  const [source, setSource] = useState<VaultFile | null>(null);
  const vault = useVaultData();
  const navigate = useNavigate();

  const useAs = (f: VaultFile, target: Section) => { setSource(f); setSection(target); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (section !== "drive" && section !== "home") vault.refetch(); }, [section]);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col p-6 gap-8">
        <div className="text-2xl font-bold tracking-tight px-3">Orbit</div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                "flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors",
                section === id ? "bg-card text-foreground shadow-[0_8px_30px_rgb(0,0,0,0.04)]" : "text-muted-foreground hover:bg-card/60"
              )}
            >
              <Icon className={cn("w-4 h-4", section === id && "text-primary")} />
              {label}
            </button>
          ))}
        </nav>
        <button onClick={() => navigate("/settings")} className="mt-auto flex items-center gap-3 px-3 h-12 rounded-xl hover:bg-card/60 text-sm text-muted-foreground">
          <ProfileAvatar size={32} />
          Profil et réglages
        </button>
      </aside>

      <main className="flex-1 min-w-0 px-12 py-10">
        <div className="max-w-6xl mx-auto">
          {section === "home" && <DesktopHome greeting={greeting()} />}
          {section === "library" && <Library vault={vault} onUse={useAs} />}
          {section === "subjects" && <SubjectLibrary vault={vault} />}
          {section === "quiz" && <QuizStudio files={vault.files} source={source} setSource={setSource} />}
          {section === "flashcards" && <FlashcardStudio files={vault.files} subjects={vault.subjects} source={source} setSource={setSource} />}
          {section === "drive" && <DrivePanel />}
        </div>
      </main>
    </div>
  );
}

/* ---------- Header ---------- */
const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <header className="mb-10">
    <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
    <p className="text-muted-foreground mt-2">{subtitle}</p>
  </header>
);

/* ---------- Library ---------- */
function Library({ vault, onUse }: { vault: ReturnType<typeof useVaultData>; onUse: (f: VaultFile, s: Section) => void }) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [type, setType] = useState<string | null>(null);

  const list = useMemo(() => {
    let l = q.trim() ? vault.searchFiles(q) : vault.files;
    if (subjectIds.length > 0) l = l.filter((f) => f.subject_id && subjectIds.includes(f.subject_id));
    if (type) l = l.filter((f) => (f.file_type || "document") === type);
    return l;
  }, [vault, q, subjectIds, type]);

  const toggleSubject = (subjectId: string) => {
    setSubjectIds((current) => current.includes(subjectId)
      ? current.filter((id) => id !== subjectId)
      : [...current, subjectId]);
  };

  const name = user?.email?.split("@")[0] ?? "";

  return (
    <>
      <Header title={`${greeting()}${name ? `, ${name}` : ""}`} subtitle={`${vault.files.length} documents dans ta bibliothèque. Choisis-en un pour créer un quiz ou des fiches.`} />
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans tes documents…"
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card shadow-[0_8px_30px_rgb(0,0,0,0.03)] outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
        {["pdf", "photo", "note", "document"].map((t) => (
          <Pill key={t} active={type === t} onClick={() => setType(type === t ? null : t)}>
            {{ pdf: "PDF", photo: "Photos", note: "Notes", document: "Documents" }[t]}
          </Pill>
        ))}
      </div>
      <div className="mb-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={subjectIds.length > 0 ? "default" : "outline"}
              className="h-11 min-w-56 justify-between rounded-xl px-4 shadow-none"
            >
              <span>
                {subjectIds.length === 0
                  ? "Toutes les matières"
                  : `${subjectIds.length} matière${subjectIds.length > 1 ? "s" : ""}`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto rounded-2xl p-2">
            {vault.subjects.map((s) => (
              <DropdownMenuCheckboxItem
                key={s.id}
                checked={subjectIds.includes(s.id)}
                onCheckedChange={() => toggleSubject(s.id)}
                onSelect={(event) => event.preventDefault()}
                className="rounded-xl py-3 pl-9"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <SubjectIcon name={s.name} legacyIcon={s.icon} size="sm" />
                  <span className="truncate">{s.name}</span>
                </span>
              </DropdownMenuCheckboxItem>
            ))}
            {subjectIds.length > 0 && (
              <DropdownMenuItem
                onSelect={() => setSubjectIds([])}
                className="mt-1 rounded-xl py-3 text-muted-foreground"
              >
                Tout désélectionner
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {vault.loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground py-24 text-center">Aucun document trouvé.</p>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
          {list.map((f) => {
            const subj = vault.subjects.find((s) => s.id === f.subject_id);
            return (
              <article key={f.id} className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {f.file_type === "photo" ? <ImageIcon className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{fileName(f)}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subj ? `${subj.name} · ` : ""}{new Date(f.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                {f.ai_summary && <p className="text-sm text-muted-foreground line-clamp-3">{f.ai_summary}</p>}
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => onUse(f, "quiz")} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Quiz</button>
                  <button onClick={() => onUse(f, "flashcards")} className="flex-1 h-10 rounded-xl bg-muted text-foreground text-sm font-medium">Fiches</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------- Library by subject ---------- */
function SubjectLibrary({ vault }: { vault: ReturnType<typeof useVaultData> }) {
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"docs" | "quiz" | "flashcards">("docs");
  const [source, setSource] = useState<VaultFile | null>(null);
  const subj = vault.subjects.find((s) => s.id === open);
  const files = useMemo(() => vault.files.filter((f) => f.subject_id === open), [vault.files, open]);
  const unfiled = vault.files.filter((f) => !f.subject_id).length;

  if (!subj) {
    return (
      <>
        <Header title="Par matière" subtitle={`Tes documents rangés par discipline${unfiled ? ` · ${unfiled} sans matière` : ""}.`} />
        {vault.subjects.length === 0 ? (
          <p className="text-muted-foreground py-24 text-center">Aucune matière pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
            {vault.subjects.map((s) => {
              const n = vault.files.filter((f) => f.subject_id === s.id).length;
              return (
                <button key={s.id} onClick={() => { setOpen(s.id); setTab("docs"); setSource(null); }}
                  className="text-left bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.07)] transition-shadow flex flex-col gap-6">
                  <SubjectIcon name={s.name} legacyIcon={s.icon} size="xl" />
                  <div>
                    <h3 className="text-lg font-semibold truncate">{s.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{n} document{n > 1 ? "s" : ""}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  }

  const useAs = (f: VaultFile, t: "quiz" | "flashcards") => { setSource(f); setTab(t); };
  return (
    <>
      <button onClick={() => setOpen(null)} className="flex items-center gap-1 h-11 -ml-2 px-2 mb-4 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" /> Toutes les matières
      </button>
      <div className="mb-10 flex items-center gap-4 [&>header]:mb-0">
        <SubjectIcon name={subj.name} legacyIcon={subj.icon} size="xl" />
        <Header title={subj.name} subtitle={`${files.length} document${files.length > 1 ? "s" : ""}${subj.teacher_name ? ` · ${subj.teacher_name}` : ""}`} />
      </div>
      <div className="flex gap-2 mb-8">
        <Pill active={tab === "docs"} onClick={() => setTab("docs")}>Documents</Pill>
        <Pill active={tab === "quiz"} onClick={() => setTab("quiz")}>Quiz</Pill>
        <Pill active={tab === "flashcards"} onClick={() => setTab("flashcards")}>Fiches</Pill>
      </div>
      {tab === "docs" && (files.length === 0 ? (
        <p className="text-muted-foreground py-24 text-center">Aucun document dans cette matière.</p>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
          {files.map((f) => (
            <article key={f.id} className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {f.file_type === "photo" ? <ImageIcon className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{fileName(f)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(f.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              {f.ai_summary && <p className="text-sm text-muted-foreground line-clamp-3">{f.ai_summary}</p>}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => useAs(f, "quiz")} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Quiz</button>
                <button onClick={() => useAs(f, "flashcards")} className="flex-1 h-10 rounded-xl bg-muted text-foreground text-sm font-medium">Fiches</button>
              </div>
            </article>
          ))}
        </div>
      ))}
      {tab === "quiz" && <QuizStudio key={subj.id} files={files} source={source} setSource={setSource} />}
      {tab === "flashcards" && <FlashcardStudio key={subj.id} files={files} subjects={vault.subjects} source={source} setSource={setSource} subjectId={subj.id} />}
    </>
  );
}

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={cn("h-10 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
    active ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground")}>{children}</button>
);

/* ---------- Source picker ---------- */
function SourcePicker({ files, source, setSource, text, setText }: {
  files: VaultFile[]; source: VaultFile | null; setSource: (f: VaultFile | null) => void; text: string; setText: (t: string) => void;
}) {
  return (
    <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
      <div>
        <label className="text-sm font-medium">Document source</label>
        <select value={source?.id ?? "__none__"} onChange={(e) => setSource(files.find((f) => f.id === e.target.value) ?? null)}
          className="mt-2 w-full h-12 px-4 rounded-2xl bg-muted outline-none text-sm">
          <option value="__none__">— Coller un texte à la place —</option>
          {files.map((f) => <option key={f.id} value={f.id}>{fileName(f)}</option>)}
        </select>
      </div>
      {!source && (
        <div>
          <label className="text-sm font-medium">Texte du cours</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Colle ici le contenu à réviser…"
            className="mt-2 w-full p-4 rounded-2xl bg-muted outline-none text-sm resize-none" />
        </div>
      )}
    </div>
  );
}

/* ---------- Quiz ---------- */
function QuizStudio({ files, source, setSource }: { files: VaultFile[]; source: VaultFile | null; setSource: (f: VaultFile | null) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"basic" | "intermediate" | "advanced">("intermediate");

  const generate = async () => {
    const extractedText = source ? source.extracted_text : text.trim();
    const fileUrl = source?.file_url || undefined;
    if (!extractedText && !fileUrl) return toast.error("Choisis un document ou colle un texte.");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { extractedText, imageBase64: fileUrl, noteId: source?.id, subjectId: source?.subject_id, questionCount: count, difficulty },
      });
      if (error) throw error;
      if (!data?.quiz?.questions?.length) throw new Error("empty");
      setQuestions(data.quiz.questions);
      setAnswers(new Array(data.quiz.questions.length).fill(null));
      setIdx(0); setSubmitted(false);
    } catch (e) {
      console.error(e);
      toast.error("Le quiz n'a pas pu être créé. Réessaie dans un instant.");
    } finally { setLoading(false); }
  };

  const score = questions ? answers.filter((a, i) => a === questions[i].correctIndex).length : 0;

  if (!questions) {
    return (
      <>
        <Header title="Créer un quiz" subtitle="Un QCM de 5 à 20 questions avec correction détaillée, généré à partir de ton cours." />
        <div className="grid grid-cols-[1fr_320px] gap-8">
          <SourcePicker files={files} source={source} setSource={setSource} text={text} setText={setText} />
          <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm font-medium mb-2">Nombre de questions</p>
              <div className="flex gap-2">{[5, 10, 15, 20].map((n) => <Pill key={n} active={count === n} onClick={() => setCount(n)}>{n}</Pill>)}</div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Difficulté</p>
              <div className="flex flex-col gap-2">
                {([["basic", "Basique", "Compréhension"], ["intermediate", "Intermédiaire", "Application"], ["advanced", "Avancé", "Synthèse"]] as const).map(([v, l, d]) => (
                  <button key={v} onClick={() => setDifficulty(v)} className={cn("h-11 px-4 rounded-xl text-sm flex justify-between items-center", difficulty === v ? "bg-foreground text-background" : "bg-muted")}>
                    <span className="font-medium">{l}</span><span className="opacity-70 text-xs">{d}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Environ {Math.round(15 + count * 3)} secondes selon la taille du document.</p>
            <button onClick={generate} disabled={loading} className="mt-auto h-12 rounded-2xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</> : "Générer le quiz"}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Header title={`${score}/${questions.length} bonnes réponses`} subtitle={`${Math.round((score / questions.length) * 100)} % — voici la correction.`} />
        <div className="space-y-6">
          {questions.map((q, i) => {
            const ok = answers[i] === q.correctIndex;
            return (
              <div key={i} className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-start gap-3">
                  <span className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", ok ? "bg-green-500/15 text-green-700" : "bg-destructive/15 text-destructive")}>
                    {ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </span>
                  <div className="space-y-2">
                    <p className="font-semibold">{q.question}</p>
                    <p className="text-sm">Bonne réponse : <span className="font-medium">{q.options[q.correctIndex]}</span></p>
                    {!ok && answers[i] != null && <p className="text-sm text-destructive">Ta réponse : {q.options[answers[i]!]}</p>}
                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={() => { setAnswers(answers.map(() => null)); setIdx(0); setSubmitted(false); }} className="h-12 px-6 rounded-2xl bg-muted font-medium flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Recommencer</button>
          <button onClick={() => setQuestions(null)} className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-medium">Nouveau quiz</button>
        </div>
      </>
    );
  }

  const q = questions[idx];
  return (
    <>
      <Header title={`Question ${idx + 1}/${questions.length}`} subtitle={source ? fileName(source) : "Texte collé"} />
      <div className="max-w-3xl">
        <div className="h-1.5 rounded-full bg-muted mb-8"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} /></div>
        <div className="bg-card rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-xl font-semibold mb-8">{q.question}</p>
          <div className="space-y-3">
            {q.options.map((o, i) => (
              <button key={i} onClick={() => setAnswers(answers.map((a, j) => (j === idx ? i : a)))}
                className={cn("w-full text-left p-4 rounded-2xl text-sm transition-colors flex gap-3",
                  answers[idx] === i ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/70")}>
                <span className="font-semibold">{"ABCD"[i]}</span>{o}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-8">
          <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="h-12 px-6 rounded-2xl bg-muted font-medium flex items-center gap-2 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /> Précédent</button>
          {idx < questions.length - 1 ? (
            <button onClick={() => setIdx(idx + 1)} className="h-12 px-6 rounded-2xl bg-foreground text-background font-medium flex items-center gap-2">Suivant <ChevronRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={() => answers.some((a) => a == null) ? toast.error("Réponds à toutes les questions avant de valider.") : setSubmitted(true)}
              className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-medium">Valider mes réponses</button>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Flashcards ---------- */
type Mark = "known" | "learning" | "unknown";

function FlashcardStudio({ files, subjects, source, setSource, subjectId }: {
  files: VaultFile[]; subjects: ReturnType<typeof useVaultData>["subjects"]; source: VaultFile | null; setSource: (f: VaultFile | null) => void; subjectId?: string;
}) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState<Card[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [marks, setMarks] = useState<Record<string, Mark>>(() => JSON.parse(localStorage.getItem("orbit_card_marks") || "{}"));

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("flashcards").select("id,question,answer,subject_id,mastered").eq("user_id", user.id).order("created_at", { ascending: false });
    const all = (data as Card[]) ?? [];
    setCards(subjectId ? all.filter((c) => c.subject_id === subjectId) : all);
  }, [user, subjectId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { localStorage.setItem("orbit_card_marks", JSON.stringify(marks)); }, [marks]);

  const decks = useMemo(() => {
    const m = new Map<string, Card[]>();
    cards.forEach((c) => { const k = c.subject_id ?? "__none__"; m.set(k, [...(m.get(k) ?? []), c]); });
    return [...m.entries()].map(([k, list]) => {
      const s = subjects.find((x) => x.id === k);
      return { key: k, name: s?.name ?? "Sans matière", list };
    });
  }, [cards, subjects]);

  const generate = async () => {
    const noteContent = source ? source.extracted_text : text.trim();
    if (!noteContent) return toast.error(source ? "Ce document n'a pas encore de texte lu." : "Colle un texte ou choisis un document.");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { noteContent, noteId: source?.id, subjectId: source?.subject_id, generateImages: false },
      });
      if (error) throw error;
      const rows = (data?.flashcards ?? []).map((c: any) => ({ user_id: user!.id, question: c.question, answer: c.answer, subject_id: source?.subject_id ?? null, mastered: false }));
      if (!rows.length) throw new Error("empty");
      const { data: saved } = await supabase.from("flashcards").insert(rows).select("id,question,answer,subject_id,mastered");
      toast.success(`${rows.length} fiches créées`);
      await load();
      if (saved) startDeck(saved as Card[]);
    } catch (e) {
      console.error(e);
      toast.error("Les fiches n'ont pas pu être créées. Réessaie dans un instant.");
    } finally { setLoading(false); }
  };

  const startDeck = (list: Card[]) => {
    // Unknown cards first, then learning, then known
    const order: Record<Mark, number> = { unknown: 0, learning: 1, known: 2 };
    setDeck([...list].sort((a, b) => order[marks[a.id] ?? "unknown"] - order[marks[b.id] ?? "unknown"]));
    setIdx(0); setFlipped(false);
  };

  const mark = (m: Mark) => {
    if (!deck) return;
    const c = deck[idx];
    setMarks((p) => ({ ...p, [c.id]: m }));
    if (m === "known") supabase.from("flashcards").update({ mastered: true }).eq("id", c.id).then(() => {});
    setFlipped(false);
    setIdx((i) => Math.min(i + 1, deck.length - 1));
  };

  useEffect(() => {
    if (!deck) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === "ArrowRight") { setIdx((i) => Math.min(i + 1, deck.length - 1)); setFlipped(false); }
      if (e.key === "ArrowLeft") { setIdx((i) => Math.max(i - 1, 0)); setFlipped(false); }
      if (e.key === "1") mark("unknown");
      if (e.key === "2") mark("learning");
      if (e.key === "3") mark("known");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (deck && deck.length) {
    const c = deck[idx];
    const count = (m: Mark) => deck.filter((d) => (marks[d.id] ?? "unknown") === m).length;
    const pct = (n: number) => Math.round((n / deck.length) * 100);
    return (
      <>
        <Header title={`Fiche ${idx + 1}/${deck.length}`} subtitle="Espace pour retourner · flèches pour naviguer · 1, 2, 3 pour noter" />
        <div className="max-w-3xl">
          <button onClick={() => setFlipped(!flipped)} className="w-full min-h-[320px] bg-card rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.05)] flex flex-col items-center justify-center text-center gap-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{flipped ? "Réponse" : "Question"}</span>
            <p className="text-2xl font-semibold leading-snug">{flipped ? c.answer : c.question}</p>
          </button>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <button onClick={() => mark("unknown")} className="h-12 rounded-2xl bg-destructive/10 text-destructive font-medium flex items-center justify-center gap-2"><X className="w-4 h-4" /> À revoir</button>
            <button onClick={() => mark("learning")} className="h-12 rounded-2xl bg-primary/10 text-primary font-medium flex items-center justify-center gap-2"><CircleDashed className="w-4 h-4" /> En cours</button>
            <button onClick={() => mark("known")} className="h-12 rounded-2xl bg-green-500/10 text-green-700 font-medium flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Connue</button>
          </div>
          <div className="flex items-center justify-between mt-8 text-sm text-muted-foreground">
            <span>Connues {pct(count("known"))} % · En cours {pct(count("learning"))} % · À revoir {pct(count("unknown"))} %</span>
            <div className="flex gap-2">
              <button onClick={() => { setDeck([...deck].sort(() => Math.random() - 0.5)); setIdx(0); setFlipped(false); }} className="h-10 px-4 rounded-xl bg-muted flex items-center gap-2"><Shuffle className="w-4 h-4" /> Mélanger</button>
              <button onClick={() => setDeck(null)} className="h-10 px-4 rounded-xl bg-muted">Terminer</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Fiches de révision" subtitle="Crée des fiches à partir d'un cours, puis révise en priorité celles que tu ne connais pas." />
      <div className="grid grid-cols-[1fr_320px] gap-8 mb-12">
        <SourcePicker files={files} source={source} setSource={setSource} text={text} setText={setText} />
        <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <p className="text-sm text-muted-foreground">Les fiches sont enregistrées et retrouvables aussi sur téléphone.</p>
          <button onClick={generate} disabled={loading} className="mt-auto h-12 rounded-2xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</> : "Générer les fiches"}
          </button>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-6">Mes paquets</h2>
      {decks.length === 0 ? <p className="text-muted-foreground">Aucune fiche pour l'instant.</p> : (
        <div className="grid grid-cols-3 gap-6">
          {decks.map((d) => {
            const known = d.list.filter((c) => marks[c.id] === "known" || c.mastered).length;
            return (
              <button key={d.key} onClick={() => startDeck(d.list)} className="text-left bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
                <p className="font-semibold">{d.name}</p>
                <p className="text-sm text-muted-foreground">{d.list.length} fiches · {known} connues</p>
                <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(known / d.list.length) * 100}%` }} /></div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------- Drive ---------- */
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

function waitForPopup(popup: Window) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => { window.removeEventListener("message", onMsg); clearInterval(poll); };
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== popup || e.data?.connectorId !== "google_drive") return;
      if (e.data.type === "appUserConnectorOAuthComplete") { cleanup(); resolve(); }
      else if (e.data.type === "appUserConnectorOAuthFailed") { cleanup(); popup.close(); reject(new Error(e.data.reason ?? "Connexion refusée.")); }
    };
    const poll = window.setInterval(() => { if (popup.closed) { cleanup(); reject(new Error("Fenêtre fermée avant la fin.")); } }, 500);
    window.addEventListener("message", onMsg);
  });
}

const typeLabel = (m: string) => m.includes("google-apps") ? "Google Doc" : m.includes("pdf") ? "PDF" : "Word";
const fmtSize = (s?: string) => !s ? "—" : Number(s) > 1e6 ? `${(Number(s) / 1e6).toFixed(1)} Mo` : `${Math.max(1, Math.round(Number(s) / 1e3))} Ko`;

interface SyncFolder { folder_id: string; folder_name: string; last_synced_at: string | null; last_imported_count: number; last_error: string | null }

function FolderSync({ folder, onChange }: { folder?: SyncFolder | null; onChange: () => void }) {
  const [picking, setPicking] = useState(false);
  const [path, setPath] = useState<{ id: string; name: string }[]>([]);
  const [folders, setFolders] = useState<{ id: string; name: string }[] | null>(null);
  const [working, setWorking] = useState(false);
  const current = path[path.length - 1];

  useEffect(() => {
    if (!picking) return;
    setFolders(null);
    callDrive({ action: "folders", parentId: current?.id }).then((d) => setFolders(d.folders ?? [])).catch((e) => { toast.error(e.message); setFolders([]); });
  }, [picking, current?.id]);

  const run = async (body: Record<string, unknown>, ok: (d: any) => string) => {
    setWorking(true);
    try { const d = await callDrive(body); toast.success(ok(d)); setPicking(false); onChange(); }
    catch (e: any) { toast.error(e.message); } finally { setWorking(false); }
  };
  const summary = (d: any) => d.imported ? `${d.imported} document${d.imported > 1 ? "s" : ""} ajouté${d.imported > 1 ? "s" : ""} à ta bibliothèque` : "Tout est déjà à jour";

  return (
    <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg">Dossier synchronisé</p>
          {folder ? (
            <p className="text-sm text-muted-foreground mt-1">
              « {folder.folder_name} » · les nouveaux documents arrivent chaque matin dans ta bibliothèque.
              {folder.last_synced_at && ` Dernière synchro le ${new Date(folder.last_synced_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}.`}
              {folder.last_error && <span className="block text-destructive mt-1">{folder.last_error}</span>}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">Choisis un dossier Drive : tout ce que tu y ranges sera importé automatiquement chaque jour.</p>
          )}
        </div>
        {folder && <button disabled={working} onClick={() => run({ action: "syncNow" }, summary)} className="h-11 px-5 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-2 disabled:opacity-60">{working && <Loader2 className="w-4 h-4 animate-spin" />}Synchroniser maintenant</button>}
        <button onClick={() => { setPicking((v) => !v); setPath([]); }} className="h-11 px-5 rounded-xl bg-muted text-sm font-medium">{folder ? "Changer" : "Choisir un dossier"}</button>
        {folder && <button onClick={() => run({ action: "clearFolder" }, () => "Synchronisation arrêtée")} className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground">Arrêter</button>}
      </div>
      {picking && (
        <div className="mt-6 rounded-2xl bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <button onClick={() => setPath([])} className="font-medium hover:underline">Mon Drive</button>
            {path.map((p, i) => <span key={p.id} className="flex items-center gap-2"><span className="text-muted-foreground">/</span><button onClick={() => setPath(path.slice(0, i + 1))} className="font-medium hover:underline">{p.name}</button></span>)}
            {current && <button disabled={working} onClick={() => run({ action: "setFolder", folderId: current.id, folderName: current.name }, summary)} className="ml-auto h-10 px-5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-60">{working && <Loader2 className="w-4 h-4 animate-spin" />}Synchroniser ce dossier</button>}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {folders === null ? <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              : folders.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Aucun sous-dossier.</p>
              : folders.map((f) => <button key={f.id} onClick={() => setPath([...path, f])} className="w-full text-left px-4 py-3 rounded-xl hover:bg-card text-sm flex items-center gap-3"><HardDrive className="w-4 h-4 text-primary" />{f.name}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

function DrivePanel() {
  const [status, setStatus] = useState<{ connected: boolean; reconnectRequired?: boolean; email?: string; folder?: SyncFolder | null } | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "pdf" | "gdoc" | "docx">("all");
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState<Record<string, "loading" | "done">>({});

  const loadStatus = useCallback(async () => {
    try { setStatus(await callDrive({ action: "status" })); } catch (e: any) { toast.error(e.message); setStatus({ connected: false }); }
  }, []);
  useEffect(() => { loadStatus(); }, [loadStatus]);

  const list = useCallback(async (append = false, token?: string | null) => {
    setBusy(true);
    try {
      const d = await callDrive({ action: "list", search: search || undefined, type, pageToken: token || undefined });
      if (!d.connected) { setStatus(d); return; }
      setFiles((f) => append ? [...f, ...d.files] : d.files); setNext(d.nextPageToken);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }, [search, type]);

  useEffect(() => {
    if (!status?.connected) return;
    const t = setTimeout(() => list(false), 300);
    return () => clearTimeout(t);
  }, [status?.connected, list]);

  const connect = async () => {
    const popup = window.open("", "orbit-drive", "width=600,height=720");
    if (!popup) return toast.error("Autorise les fenêtres pop-up puis réessaie.");
    try {
      const { authorizationUrl } = await callDrive({ action: "start", origin: window.location.origin });
      const done = waitForPopup(popup);
      popup.location.href = authorizationUrl;
      await done;
      toast.success(status?.reconnectRequired ? "Google Drive reconnecté" : "Google Drive connecté");
      await loadStatus();
    } catch (e: any) { popup.close(); toast.error(e.message); }
  };

  const disconnect = async () => {
    await callDrive({ action: "disconnect" }).catch(() => null);
    setFiles([]); setStatus({ connected: false }); toast.success("Google Drive déconnecté");
  };

  const importFile = async (f: DriveFile) => {
    setImporting((s) => ({ ...s, [f.id]: "loading" }));
    try {
      const d = await callDrive({ action: "import", fileId: f.id });
      if (d.reconnectRequired) { setStatus(d); throw new Error("Ton accès Google Drive doit être renouvelé."); }
      setImporting((s) => ({ ...s, [f.id]: "done" }));
      toast.success(`« ${d.name} » ajouté à ta bibliothèque`);
    } catch (e: any) {
      setImporting((s) => { const n = { ...s }; delete n[f.id]; return n; });
      toast.error(e.message);
    }
  };

  if (!status) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (!status.connected) {
    return (
      <>
        <Header title="Google Drive" subtitle="Importe tes cours directement depuis ton Drive." />
        <div className="bg-card rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl space-y-5">
          <HardDrive className="w-8 h-8 text-primary" />
          <p className="font-semibold text-lg">{status.reconnectRequired ? "Ton accès Google Drive doit être renouvelé" : "Connecte ton Google Drive"}</p>
          <p className="text-sm text-muted-foreground">
            Orbit accède à ton Drive en lecture seule : il peut lister et copier les documents que tu choisis (PDF, Google Docs, Word), jamais les modifier ni les supprimer. Tu peux te déconnecter à tout moment.
          </p>
          <button onClick={connect} className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-medium">
            {status.reconnectRequired ? "Reconnecter Google Drive" : "Connecter Google Drive"}
          </button>
        </div>
        <div className="max-w-2xl mt-10 space-y-6">
          <p className="font-semibold text-lg">Comment ça marche</p>
          {[
            ["Connecte ton compte", "Clique sur « Connecter Google Drive », choisis ton compte Google et accepte l'accès en lecture seule."],
            ["Choisis un dossier", "Sélectionne le dossier où tu ranges tes cours. Orbit y importera chaque nouveau document automatiquement, chaque matin."],
            ["Ou importe à la main", "Clique sur n'importe quel fichier de la liste pour l'ajouter tout de suite à ta Bibliothèque."],
            ["Révise", "Tes documents apparaissent dans Bibliothèque : lance un quiz ou crée des fiches en un clic."],
          ].map(([t, d], i) => (
            <div key={t} className="flex gap-5 bg-card rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
              <span className="w-9 h-9 shrink-0 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">{i + 1}</span>
              <div><p className="font-medium">{t}</p><p className="text-sm text-muted-foreground mt-1">{d}</p></div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Google Drive" subtitle={`Connecté${status.email ? ` en tant que ${status.email}` : ""}. Choisis les documents à importer.`} />
      <FolderSync folder={status.folder} onChange={loadStatus} />
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom…"
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card shadow-[0_8px_30px_rgb(0,0,0,0.03)] outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        </div>
        {([["all", "Tout"], ["pdf", "PDF"], ["gdoc", "Google Docs"], ["docx", "Word"]] as const).map(([v, l]) => (
          <Pill key={v} active={type === v} onClick={() => setType(v)}>{l}</Pill>
        ))}
        <button onClick={disconnect} className="ml-auto text-sm text-muted-foreground hover:text-foreground">Se déconnecter</button>
      </div>
      <div className="bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {files.length === 0 && !busy && <p className="p-10 text-center text-muted-foreground">Aucun document trouvé.</p>}
        {files.map((f) => (
          <div key={f.id} className="flex items-center gap-4 px-8 py-5 border-b border-border/40 last:border-0">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{f.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{typeLabel(f.mimeType)} · {fmtSize(f.size)} · modifié le {new Date(f.modifiedTime).toLocaleDateString("fr-FR")}</p>
            </div>
            <button disabled={!!importing[f.id]} onClick={() => importFile(f)}
              className={cn("h-10 px-5 rounded-xl text-sm font-medium flex items-center gap-2 min-w-[120px] justify-center",
                importing[f.id] === "done" ? "bg-green-500/10 text-green-700" : "bg-foreground text-background disabled:opacity-60")}>
              {importing[f.id] === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Import…</> : importing[f.id] === "done" ? <><Check className="w-4 h-4" /> Importé</> : "Importer"}
            </button>
          </div>
        ))}
        {busy && <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
      </div>
      {next && !busy && <button onClick={() => list(true, next)} className="mt-6 h-11 px-6 rounded-2xl bg-muted text-sm font-medium">Charger plus</button>}
    </>
  );
}
