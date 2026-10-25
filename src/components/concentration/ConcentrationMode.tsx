import { useEffect, useMemo, useRef, useState } from "react";
import { createCoalescedSaver } from "@/lib/coalescedSaver";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, BookOpen, Check, ChevronRight, Clock3, Focus, Lightbulb, Loader2, Pause, Play, RotateCcw, Star, Trophy, Volume2, X, ExternalLink, MessageCircle, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { OrbitCompanion, type CompanionHandle } from "@/components/ai/OrbitCompanion";
import { SubjectIcon } from "@/components/SubjectIcon";
import { useOrbitVoice } from "@/hooks/useOrbitVoice";
import { concentrationCall, useConcentration, type ConcentrationResult } from "@/hooks/useConcentration";
import { understandingLevel, toggleAnswer, type LearningActivity, type LearningResponse } from "@/lib/concentration";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ConcentrationMode({ onExit }: { onExit: () => void }) {
  const [params, setParams] = useSearchParams();
  const pathId = params.get("learningPath");
  const { overview, journey, action } = useConcentration(pathId);
  const [subject, setSubject] = useState("__none__");
  const [exam, setExam] = useState(""); const [duration, setDuration] = useState(20);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false); const [paused, setPaused] = useState(false);
  const [responses, setResponses] = useState<LearningResponse[]>([]);
  const [result, setResult] = useState<ConcentrationResult | null>(null);
  const [source, setSource] = useState<{ title: string; text: string; fileId?: string } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const request = useRef(crypto.randomUUID()); const companion = useRef<CompanionHandle>(null); const navigate = useNavigate();
  const voice = useOrbitVoice(companion, text => { sessionStorage.setItem("orbit_ai_prompt", text); navigate("/?section=ai&tab=lab"); });
  const data = journey.data, activities = data?.activities ?? [];
  const current = activities.find(a => a.status === "ready");
  const activity = activities.find(a => a.id === selected) ?? current;
  const concept = data?.concepts.find(c => c.id === activity?.concept_id);
  const done = activities.filter(a => a.status === "completed").length;
  const busy = action.isPending;
  const draftSaver = useMemo(() => createCoalescedSaver<Record<string, unknown>>(
    body => concentrationCall({ pathId, action: "session", ...body }),
    error => setLocalError((error as Error).message),
  ), [pathId]);
  useEffect(() => () => { void draftSaver.flush().catch(() => undefined); }, [draftSaver]);

  useEffect(() => {
    if (!data) return;
    setExam(data.path.exam_date ?? ""); setDuration(data.path.duration_minutes);
  }, [data?.path.id]);
  useEffect(() => {
    if (!data || selected) return;
    const resume = activities.find(a => a.id === data.session?.activity_id && a.status !== "completed");
    setSelected(resume?.id ?? current?.id ?? activities[0]?.id ?? null);
    if (resume) { setResponses(data.session?.draft.responses ?? []); setPaused(data.session?.status === "paused"); }
  }, [data, selected, activities, current]);
  const run = async (body: Record<string, unknown>) => {
    setLocalError(null);
    try { await draftSaver.flush(); return await action.mutateAsync(body); } catch (e) { setLocalError((e as Error).message); return null; }
  };
  const pick = (a: LearningActivity) => { setSelected(a.id); setPlaying(false); setPaused(false); setResult(null); setResponses([]); request.current = crypto.randomUUID(); voice.stopAudio(); };
  const start = async (a: LearningActivity) => {
    const values = a.id === activity?.id && responses.length ? responses : a.content.questions.map(() => ({ selected: [], hints: 0 }));
    const saved = await run({ action: "session", activityId: a.id, status: "active", responses: values });
    if (saved) { setSelected(a.id); setResponses(values); setPaused(false); setPlaying(true); setResult(null); request.current = crypto.randomUUID(); }
  };
  const changeAnswer = async (index: number, choice: number) => {
    if (!activity) return;
    const next = activity.content.questions.map((q, i) => i === index ? toggleAnswer(responses[i] ?? { selected: [], hints: 0 }, choice, q.type === "multiple") : responses[i] ?? { selected: [], hints: 0 });
    setResponses(next); draftSaver.schedule({ activityId: activity.id, responses: next, status: "active" });
  };
  const hint = async (index: number) => {
    if (!activity) return;
    const next = activity.content.questions.map((_, i) => ({ ...(responses[i] ?? { selected: [], hints: 0 }), hints: i === index ? 1 : responses[i]?.hints ?? 0 }));
    setResponses(next); draftSaver.schedule({ activityId: activity.id, responses: next, status: "active" });
  };
  const finish = async () => {
    if (!activity) return;
    const response = await run({ action: activity.kind === "lesson" ? "complete" : "grade", activityId: activity.id, requestId: request.current, responses });
    if (!response) return;
    if (activity.kind === "lesson" && response.activity) { pick(response.activity); await start(response.activity); }
    else setResult(response);
  };
  const leave = async () => {
    voice.stopAudio();
    if (activity && pathId && playing && !result) { const saved = await run({ action: "session", activityId: activity.id, status: "paused", responses }); if (!saved) return; }
    onExit();
  };
  const errors = localError ?? (overview.error as Error)?.message ?? (journey.error as Error)?.message;
  const mascot = <OrbitCompanion ref={companion} concentration state={busy ? "thinking" : voice.state} size={88} />;
  const errorView = errors && <div role="alert" className="rounded-2xl bg-destructive/10 p-5 text-sm space-y-3"><p>{errors}</p><Button variant="outline" disabled={busy} onClick={() => { setLocalError(null); overview.refetch(); if (pathId) journey.refetch(); }}><RotateCcw />Réessayer</Button></div>;

  if (overview.isLoading) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-primary" aria-label="Chargement" /></div>;
  if (overview.data && !overview.data.introSeen) return <section className="concentration-workspace max-w-2xl mx-auto py-12 space-y-8 text-center">
    <div className="flex justify-center">{mascot}</div><p className="text-sm font-semibold text-primary">Mode Concentration</p>
    <h1 className="text-3xl font-bold">Ton compagnon d’apprentissage personnel</h1>
    <p className="text-muted-foreground leading-relaxed">Orbit s’appuie sur tes cours, découvre ce que tu comprends et prépare un parcours pour tes examens.</p>
    <div className="grid gap-5 text-left sm:grid-cols-2">{[[BookOpen, "Tes cours, tes sources"], [Focus, "Un parcours personnalisé"], [Lightbulb, "Leçons et quiz préparés"], [Trophy, "Des progrès observés"]].map(([Icon, label]) => { const I = Icon as typeof BookOpen; return <div key={String(label)} className="flex items-center gap-3"><I className="text-primary h-5 w-5" /><span>{String(label)}</span></div>; })}</div>
    {errorView}<div className="flex flex-wrap justify-center gap-3"><Button disabled={busy} size="lg" onClick={() => run({ action: "intro" })}><Play />Commencer à apprendre</Button><Button disabled={busy} variant="ghost" onClick={() => run({ action: "intro" })}>Passer l’introduction</Button><Button variant="ghost" onClick={onExit}>Quitter</Button></div>
  </section>;

  return <div className="concentration-workspace space-y-8 pb-safe">
    <header className="flex items-center gap-3"><Button variant="ghost" size="icon" className="h-11 w-11 rounded-full shrink-0" aria-label="Quitter Concentration" disabled={busy} onClick={leave}><ArrowLeft /></Button><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary">Mode Concentration</p><h1 className="text-2xl font-bold break-words">{data?.path.title ?? "Que veux-tu apprendre ?"}</h1></div><Focus className="text-primary shrink-0" /></header>
    {errorView}
    {!pathId && <section className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-5">{mascot}<p className="text-muted-foreground">Choisis une matière. Je prépare la première étape à partir de tes cours disponibles.</p></div>
      <div className="grid sm:grid-cols-2 gap-4">{overview.data?.subjects.map(s => <Button key={s.id} variant="ghost" disabled={busy} onClick={() => { setSubject(s.id); setExam(overview.data?.exams.find(e => e.subject_id === s.id)?.exam_date ?? ""); }} className={cn("h-auto min-h-20 justify-start whitespace-normal rounded-2xl bg-card p-5 shadow-soft", subject === s.id && "ring-2 ring-primary")}><SubjectIcon name={s.name} legacyIcon={s.icon} className="h-6 w-6 shrink-0" /><span className="text-left break-words">{s.name}</span>{overview.data?.paths.some(p => p.subject_id === s.id) && <Check className="ml-auto text-primary" />}</Button>)}</div>
      {!overview.data?.subjects.length && <div className="space-y-4"><p>Aucune matière disponible pour l’instant.</p><Button onClick={() => navigate("/?section=subjects&tab=vault")}>Mes matières</Button></div>}
      <Goal exam={exam} duration={duration} setExam={setExam} setDuration={setDuration} />
      <Button disabled={busy || subject === "__none__"} size="lg" onClick={async () => { const response = await run({ action: "create", subjectId: subject, examDate: exam || null, duration }); if (response?.pathId) { const next = new URLSearchParams(params); next.set("learningPath", response.pathId); setParams(next); } }}>{busy ? <Loader2 className="animate-spin" /> : <Play />}{overview.data?.paths.some(p => p.subject_id === subject) ? "Reprendre mon parcours" : "Préparer mon parcours"}</Button>
      {busy && <p role="status" className="text-sm text-muted-foreground">Orbit lit les textes disponibles et prépare tes leçons et tes questions…</p>}
    </section>}
    {pathId && journey.isLoading && <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}
    {data && <>
      <div className="flex items-center gap-4 flex-wrap"><Select value={data.path.id} onValueChange={id => { const next = new URLSearchParams(params); next.set("learningPath", id); setParams(next); setSelected(null); setPlaying(false); setResult(null); }}><SelectTrigger className="w-full sm:w-64 h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{overview.data?.paths.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select><Button variant="ghost" disabled={busy} onClick={() => { const next = new URLSearchParams(params); next.delete("learningPath"); setParams(next); setSelected(null); setPlaying(false); }}>Changer de matière</Button><span className="text-sm text-muted-foreground sm:ml-auto">{done}/{activities.length} activités terminées</span></div>
      <Progress value={activities.length ? done / activities.length * 100 : 0} className="h-2" aria-label="Activités terminées" />
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          {playing && activity ? <article className="space-y-6">
            <div className="flex gap-2 flex-wrap"><Button variant="ghost" disabled={busy} onClick={async () => { if (await run({ action: "session", activityId: activity.id, status: "paused", responses })) { setPlaying(false); setPaused(true); voice.stopAudio(); } }}><ArrowLeft />Parcours</Button><Button variant="ghost" disabled={busy} onClick={async () => { if (await run({ action: "session", activityId: activity.id, status: paused ? "active" : "paused", responses })) { setPaused(!paused); voice.stopAudio(); } }}>{paused ? <Play /> : <Pause />}{paused ? "Continuer" : "Pause"}</Button><Button variant="ghost" disabled={busy} onClick={async () => { if (await run({ action: "session", activityId: activity.id, status: "skipped", responses })) { setPlaying(false); setSelected(activities.find(a => a.status === "ready" && a.id !== activity.id)?.id ?? null); } }}><SkipForward />Passer</Button></div>
            <h2 className="text-2xl font-bold break-words">{activity.title}</h2>
            {paused ? <div className="py-12 text-center space-y-4"><Pause className="mx-auto text-primary" /><p>Ta séance est en pause. Tes réponses sont enregistrées.</p></div> : <>
              {activity.content.lesson && <div className="concentration-prose leading-relaxed"><ReactMarkdown>{activity.content.lesson}</ReactMarkdown></div>}
              {activity.status === "completed" && <p className="text-sm text-muted-foreground">Activité terminée · relecture sans nouvelle évaluation.</p>}
              {!result && activity.content.questions.map((q, index) => <fieldset key={index} disabled={busy || activity.status === "completed"} className="space-y-4 rounded-2xl bg-card p-5 sm:p-6 shadow-soft"><legend className="sr-only">Question {index + 1}</legend><p className="text-xs text-muted-foreground">Question {index + 1}/{activity.content.questions.length} {q.type === "multiple" ? "· Plusieurs réponses" : ""}</p><p className="font-semibold leading-relaxed">{q.question}</p><div className="space-y-2">{q.options.map((option, i) => <Button key={i} variant="outline" aria-pressed={responses[index]?.selected.includes(i) ?? false} onClick={() => changeAnswer(index, i)} className={cn("h-auto min-h-12 w-full justify-start whitespace-normal text-left rounded-xl px-4 py-3", responses[index]?.selected.includes(i) && "border-primary bg-accent text-accent-foreground")}><span className="shrink-0 text-xs">{String.fromCharCode(65 + i)}</span><span className="break-words">{option}</span></Button>)}</div>{responses[index]?.hints ? <p className="text-sm text-muted-foreground">{q.hint}</p> : <Button variant="ghost" onClick={() => hint(index)}><Lightbulb />Un indice</Button>}</fieldset>)}
              {result?.result && <section aria-live="polite" className="space-y-5"><h3 className="text-xl font-bold">{result.result.correct}/{result.result.total} réponses justes</h3>{result.result.feedback.map((f, i) => <div key={i} className="bg-card rounded-2xl p-5 space-y-2"><p className="font-semibold flex gap-2">{f.correct ? <Check className="text-primary" /> : <Lightbulb className="text-primary" />}Question {i + 1}</p><p className="text-sm leading-relaxed">{f.explanation}</p></div>)}<p className="text-sm text-muted-foreground">Ces observations font évoluer ton parcours ; elles ne prédisent pas ta note à l’examen.</p>{result.preparationError && <p role="alert">{result.preparationError}</p>}{result.next?.activity ? <><p>{result.next.targeted ? "J’ai préparé une explication plus simple et de nouvelles questions pour cette notion." : "La prochaine activité est prête."}</p><Button disabled={busy} onClick={() => { const a = result.next?.activity; if (a) { pick(a); start(a); } }}><Play />Continuer l’apprentissage</Button></> : <Button disabled={busy} onClick={async () => { const next = await run({ action: "next", activityId: activity.id }); if (next?.activity) { pick(next.activity); start(next.activity); } else if (next) { setPlaying(false); toast.success("Parcours initial terminé."); } }}><ChevronRight />Préparer la suite</Button>}</section>}
              {!result && activity.status !== "completed" && <Button disabled={busy || (activity.content.questions.length > 0 && (responses.length !== activity.content.questions.length || responses.some(r => !r.selected.length)))} size="lg" onClick={finish}>{busy ? <Loader2 className="animate-spin" /> : <Check />}{activity.kind === "lesson" ? "J’ai compris, passons aux questions" : "Valider mes réponses"}</Button>}
            </>}
          </article> : <>
            <p className="text-sm text-muted-foreground mb-3">{concept?.section ?? "Ton parcours"}</p><h2 className="text-2xl font-bold">Une notion à la fois</h2>
            <div className="learning-path relative mx-auto max-w-lg py-10">{activities.map((a, index) => {
              const Icon = a.status === "completed" ? Check : a.kind === "lesson" ? BookOpen : a.kind === "practice" ? RotateCcw : index === activities.length - 1 ? Trophy : Star;
              return <div key={a.id} className={cn("learning-node-row relative flex items-center gap-5 h-36", index % 2 ? "pl-[24%]" : "pl-[5%]")}>
                {index < activities.length - 1 && <svg className="learning-connector absolute w-32 h-36 pointer-events-none" aria-hidden="true" viewBox="0 0 128 144"><path d={index % 2 ? "M40 45 C90 90 -30 100 -35 144" : "M40 45 C-10 90 120 100 125 144"} fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" /></svg>}
                <Button variant="ghost" aria-label={a.title} aria-pressed={activity?.id === a.id} onClick={() => pick(a)} className={cn("learning-node z-10 shrink-0 h-20 w-20 rounded-full p-0", a.status === "completed" ? "bg-primary text-primary-foreground" : a.id === current?.id ? "bg-accent text-accent-foreground ring-4 ring-primary/25" : "bg-muted text-muted-foreground", activity?.id === a.id && "outline outline-2 outline-offset-4 outline-primary")}><Icon className="!h-7 !w-7" /></Button>
                <div className="relative z-10 min-w-0"><p className="font-semibold text-sm break-words leading-relaxed">{a.title}</p><p className="mt-1 text-xs text-muted-foreground">{a.status === "completed" ? "Terminé · revoir" : a.status === "skipped" ? "Passé · disponible" : a.id === current?.id ? "À toi de jouer" : "Disponible"}</p>{a.id === current?.id && <span className="inline-block mt-2 text-xs font-bold text-primary">CONTINUER</span>}</div>
              </div>;
            })}</div>
          </>}
        </section>
        <aside className="space-y-6 min-w-0 xl:sticky xl:top-8 self-start">
          <div className="flex items-center gap-4">{mascot}<div><p className="text-sm font-semibold">Orbit est avec toi</p><p className="text-xs text-muted-foreground">Une étape après l’autre.</p></div></div>
          {concept && <div className="space-y-4"><h3 className="text-xl font-bold break-words">{concept.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{concept.objective}</p><p className="text-sm flex items-center gap-2"><Clock3 className="w-4 h-4" />{activity?.kind === "lesson" ? "5" : "8"} min environ</p><p className="text-sm font-semibold">{understandingLevel(concept)}</p><p className="text-xs text-muted-foreground">{concept.question_count} réponses observées · {concept.retention_count ? "rétention vérifiée" : "rétention à vérifier"}</p>{concept.review_at && <p className="text-xs text-muted-foreground">Révision prévue le {new Date(concept.review_at).toLocaleDateString("fr-FR")}</p>}{!playing && activity && <Button className="w-full" disabled={busy} onClick={() => start(activity)}><Play />{activity.status === "completed" ? "Revoir" : paused ? "Reprendre" : "Commencer"}</Button>}</div>}
          <div className="flex flex-wrap gap-2"><Button variant="ghost" disabled={busy || !activity} onClick={() => activity && voice.speak(activity.content.lesson || concept?.objective || "")}><Volume2 />Écouter Orbit</Button>{playing && <Button variant="ghost" disabled={busy} onClick={async () => { const next = await run({ action: "simplify", activityId: activity?.id }); if (next?.activity) { pick(next.activity); start(next.activity); } }}><Lightbulb />Expliquer autrement</Button>}<Button variant="ghost" onClick={() => { sessionStorage.setItem("orbit_ai_prompt", `Aide-moi à comprendre ${concept?.title ?? data.path.title} à partir de mes cours.`); navigate("/?section=ai&tab=lab"); }}><MessageCircle />Demander à Orbit</Button></div>
          <section className="space-y-3"><h3 className="font-semibold text-sm">Sources de cette étape</h3>{data.path.sources.filter(s => activity?.content.source_ids.includes(s.id)).map(s => <Button key={s.id} variant="ghost" disabled={busy} className="w-full justify-start h-auto min-h-11 whitespace-normal text-left" onClick={async () => { const response = await run({ action: "source", sourceId: s.id }); if (response?.source) setSource(response.source); }}><BookOpen /><span className="break-words">{s.title}</span><ExternalLink className="ml-auto shrink-0" /></Button>)}<p className="text-xs text-muted-foreground leading-relaxed">{data.path.coverage_note}</p></section>
          <details className="space-y-4"><summary className="cursor-pointer min-h-11 text-sm font-semibold">Mon objectif d’examen</summary><Goal exam={exam} duration={duration} setExam={setExam} setDuration={setDuration} /><Button variant="outline" disabled={busy} onClick={async () => { if (await run({ action: "goal", examDate: exam || null, duration })) toast.success("Objectif enregistré."); }}>Enregistrer l’objectif</Button></details>
        </aside>
      </div>
    </>}
    {source && <section className="rounded-2xl bg-card p-6 space-y-4 shadow-soft"><div className="flex items-center gap-3"><h2 className="text-xl font-bold flex-1 break-words">{source.title}</h2><Button variant="ghost" size="icon" aria-label="Fermer la source" onClick={() => setSource(null)}><X /></Button></div><p className="whitespace-pre-wrap leading-relaxed text-sm">{source.text}</p>{source.fileId && <Button variant="outline" onClick={() => navigate(`/study/${source.fileId}`)}>Ouvrir le document original</Button>}</section>}
  </div>;
}
function Goal({ exam, duration, setExam, setDuration }: { exam: string; duration: number; setExam: (v: string) => void; setDuration: (v: number) => void }) {
  return <div className="grid sm:grid-cols-2 gap-4"><label className="space-y-2 text-sm block"><span>Examen (facultatif)</span><Input type="date" value={exam} onChange={e => setExam(e.target.value)} className="h-11" /></label><label className="space-y-2 text-sm block"><span>Minutes par séance</span><Input type="number" min={5} max={120} value={duration} onChange={e => setDuration(Math.min(120, Math.max(5, Number(e.target.value))))} className="h-11" /></label></div>;
}