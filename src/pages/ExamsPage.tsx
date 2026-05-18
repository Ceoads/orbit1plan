import { useMemo, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { useOrbitData, CalendarEvent } from "@/hooks/useOrbitData";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { AddExamModal } from "@/components/modals";
import { cn } from "@/lib/utils";

const MONTH_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const fmtFr = (iso: string): string => {
  const d = new Date(iso);
  const w = d.toLocaleDateString("fr-FR", { weekday: "long" });
  return `${w} ${d.getDate()} ${MONTH_FR[d.getMonth()]}`;
};

const daysUntil = (iso: string): number =>
  Math.ceil((new Date(iso).getTime() - new Date().getTime()) / 86400000);

const urgencyClass = (days: number): string => {
  if (days < 3) return "bg-destructive text-destructive-foreground";
  if (days <= 7) return "bg-primary text-primary-foreground";
  return "bg-[hsl(var(--surface-secondary))] text-foreground border border-[hsl(var(--border))]";
};

export const ExamsPage = () => {
  const { events, getSubjectById, subjects } = useOrbitData();
  const haptics = useHaptics();
  const sounds = useSoundEffects();
  const [showAdd, setShowAdd] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const now = new Date();
  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.event_type === "exam" && e.exam_date && new Date(e.exam_date) >= now)
        .sort((a, b) => (a.exam_date! < b.exam_date! ? -1 : 1)),
    [events]
  );
  const done = useMemo(
    () =>
      events
        .filter((e) => e.event_type === "exam" && e.exam_date && new Date(e.exam_date) < now)
        .sort((a, b) => (a.exam_date! < b.exam_date! ? 1 : -1)),
    [events]
  );

  const renderExam = (exam: CalendarEvent, isDone = false) => {
    const subject = getSubjectById(exam.subject_id);
    const days = exam.exam_date ? daysUntil(exam.exam_date) : 0;
    return (
      <div
        key={exam.id}
        className={cn(
          "bg-card border border-[hsl(var(--border))] rounded-[12px] p-7 transition-[border-color] duration-150 ease-out hover:border-[hsl(var(--border-hover))]",
          isDone && "opacity-60"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-mono-body text-foreground">
              {subject?.name || exam.title}
            </p>
            {exam.exam_date && (
              <p className="text-mono-meta mt-1.5">{fmtFr(exam.exam_date)}</p>
            )}
          </div>
          {!isDone && exam.exam_date && (
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium tracking-[0.04em] rounded-[8px] px-2.5 py-1",
                urgencyClass(days)
              )}
            >
              {days} jour{days > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Progress bar — placeholder until preparation score wired in */}
        {!isDone && (
          <div className="mt-5">
            <div className="h-[2px] bg-[hsl(var(--border))] overflow-hidden">
              <div
                className="h-full bg-primary transition-[width] ease-mono"
                style={{ width: "0%", transitionDuration: "600ms" }}
              />
            </div>
            <p className="text-[11px] font-medium text-muted-foreground mt-2">
              0% prepared
            </p>
          </div>
        )}

        {exam.room_number && (
          <p className="text-mono-meta mt-3">{exam.room_number}</p>
        )}
      </div>
    );
  };

  return (
    <div className="font-mono pb-32">
      <h1 className="text-mono-title text-foreground">Examens</h1>

      <p className="text-mono-section mt-10 mb-4">À venir</p>

      {upcoming.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-mono-body text-foreground">Aucun examen prévu</p>
        </div>
      ) : (
        <div className="space-y-3">{upcoming.map((e) => renderExam(e))}</div>
      )}

      {/* Completed (collapsible) */}
      {done.length > 0 && (
        <div className="mt-14">
          <button
            onClick={() => {
              haptics.selection();
              sounds.tap();
              setShowDone((s) => !s);
            }}
            className="flex items-center gap-2 text-mono-section hover:text-foreground transition-colors"
          >
            <span>Terminés ({done.length})</span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-200 ease-out",
                showDone && "rotate-180"
              )}
              strokeWidth={2}
            />
          </button>
          {showDone && (
            <div className="space-y-3 mt-4">
              {done.map((e) => renderExam(e, true))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          haptics.soft();
          sounds.tap();
          setShowAdd(true);
        }}
        className="mt-14 w-full h-[52px] bg-primary text-primary-foreground rounded-[12px] font-mono text-sm font-medium flex items-center justify-center gap-2 transition-opacity duration-150 ease-out hover:opacity-90"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Add exam
      </button>

      <AddExamModal
        open={showAdd}
        onOpenChange={setShowAdd}
        subjects={subjects}
      />
    </div>
  );
};
