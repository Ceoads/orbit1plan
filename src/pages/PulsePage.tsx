import { useEffect, useMemo, useState } from "react";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { toLocalDateStr } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import { AddClassModal } from "@/components/modals";

const DAY_3 = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const MONTH_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const PulsePage = () => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const sounds = useSoundEffects();
  const { events, subjects, tasks, getSubjectById, getUpcomingExams } = useOrbitData();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showAddClass, setShowAddClass] = useState(false);

  // Two weeks of strip centred on today (-7..+7)
  const stripDays = useMemo(
    () => Array.from({ length: 21 }, (_, i) => addDays(today, i - 7)),
    [today]
  );

  // Scroll today into view on mount
  useEffect(() => {
    const el = document.getElementById("strip-day-today");
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  const dateStr = toLocalDateStr(selectedDate);
  const dayOfWeek = selectedDate.getDay();

  const dayEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (e.event_date) return e.event_date === dateStr;
        return e.day_of_week === dayOfWeek;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [events, dateStr, dayOfWeek]);

  const todayTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.status === "done" || t.is_subtask) return false;
        if (!t.due_date) return false;
        return toLocalDateStr(new Date(t.due_date)) === dateStr;
      }),
    [tasks, dateStr]
  );

  const todayExams = useMemo(
    () => getUpcomingExams().filter((e) => e.exam_date === dateStr),
    [getUpcomingExams, dateStr]
  );

  const completedCount = dayEvents.filter((e) => {
    const [eh, em] = e.end_time.split(":").map(Number);
    const end = new Date(selectedDate);
    end.setHours(eh, em, 0, 0);
    return end < new Date();
  }).length;

  const greeting = useMemo(() => {
    const w = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
    return `${w}, ${MONTH_FR[selectedDate.getMonth()].charAt(0).toUpperCase()}${MONTH_FR[selectedDate.getMonth()].slice(1)} ${selectedDate.getDate()}`;
  }, [selectedDate]);

  const handleDayClick = (d: Date) => {
    haptics.selection();
    sounds.tap();
    setSelectedDate(d);
  };

  return (
    <div className="font-mono pb-32">
      {/* Title */}
      <h1 className="text-mono-title text-foreground">Schedule</h1>

      {/* Greeting */}
      <p className="text-mono-body text-foreground mt-3">{greeting}</p>

      {/* Sub-summary */}
      <p className="text-mono-meta mt-1">
        Tu as {todayTasks.length} tâche{todayTasks.length === 1 ? "" : "s"} et{" "}
        {todayExams.length} examen{todayExams.length === 1 ? "" : "s"} aujourd'hui.
      </p>

      {/* Stats line */}
      <p className="text-mono-meta mt-6">
        {dayEvents.length} items · {completedCount} completed
      </p>

      {/* Week strip — horizontal scroll */}
      <div className="mt-10 -mx-6 px-6 overflow-x-auto scrollbar-thin">
        <div className="flex gap-0 min-w-max">
          {stripDays.map((d) => {
            const isSelected = toLocalDateStr(d) === toLocalDateStr(selectedDate);
            const isToday = toLocalDateStr(d) === toLocalDateStr(today);
            return (
              <button
                key={d.toISOString()}
                id={isToday ? "strip-day-today" : undefined}
                onClick={() => handleDayClick(d)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-14 py-3 transition-colors duration-150 ease-out",
                  "border-r border-[hsl(var(--border))] last:border-r-0",
                  isSelected
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-[10px] font-medium tracking-[0.08em]">
                  {DAY_3[d.getDay()]}
                </span>
                <span
                  className={cn(
                    "text-base font-semibold tabular-nums",
                    isSelected && "text-primary"
                  )}
                >
                  {d.getDate()}
                </span>
                {isToday && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section label */}
      <p className="text-mono-section mt-14 mb-4">Today</p>

      {/* Courses list */}
      {dayEvents.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-mono-body text-foreground">Pas de cours aujourd'hui</p>
          <p className="text-mono-meta mt-2">
            Tu peux profiter de ton temps libre.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayEvents.map((event) => {
            const subject = getSubjectById(event.subject_id);
            return (
              <button
                key={event.id}
                onClick={() => navigate(`/course/${event.id}`)}
                className="w-full text-left bg-card border border-[hsl(var(--border))] rounded-[12px] p-7 transition-[border-color] duration-150 ease-out hover:border-[hsl(var(--border-hover))]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-mono-body text-foreground truncate">
                      {subject?.name || event.title}
                    </p>
                    <p className="text-mono-meta mt-1.5">
                      {event.start_time.slice(0, 5)} — {event.end_time.slice(0, 5)}
                      {event.room_number && (
                        <>
                          {" · "}
                          {event.room_number}
                        </>
                      )}
                    </p>
                  </div>
                  {event.event_type === "exam" && (
                    <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-primary border border-primary/30 rounded-[8px] px-2 py-1">
                      Exam
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add course button — bottom of content */}
      <button
        onClick={() => {
          haptics.soft();
          sounds.tap();
          setShowAddClass(true);
        }}
        className="mt-14 w-full h-[52px] bg-primary text-primary-foreground rounded-[12px] font-mono text-sm font-medium flex items-center justify-center gap-2 transition-opacity duration-150 ease-out hover:opacity-90"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Add course
      </button>

      <AddClassModal
        open={showAddClass}
        onOpenChange={setShowAddClass}
        subjects={subjects}
      />
    </div>
  );
};
