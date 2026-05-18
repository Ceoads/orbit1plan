import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Search, CheckSquare, Pencil, Plus } from "lucide-react";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { getCourseColor } from "@/lib/courseColors";
import { cn } from "@/lib/utils";

interface Props {
  currentDate: Date;
  weekDays: Date[];
  events: CalendarEvent[];
  subjects: Subject[];
  onSelectDay: (d: Date) => void;
  onEventClick?: (e: CalendarEvent) => void;
}

const DAY_LABELS_FR = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const durationLabel = (start: string, end: string) => {
  const mins = toMin(end) - toMin(start);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h00` : `${h}h${m.toString().padStart(2, "0")}`;
};

export const CalendarTodayList = ({
  currentDate,
  weekDays,
  events,
  subjects,
  onSelectDay,
  onEventClick,
}: Props) => {
  const dateStr = toLocalDateStr(currentDate);
  const isToday = (d: Date) =>
    d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) =>
    d.toDateString() === currentDate.toDateString();

  const dayEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (e.event_date) return e.event_date === dateStr;
        return e.day_of_week === currentDate.getDay();
      })
      .sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
  }, [events, dateStr, currentDate]);

  const totalMinutes = dayEvents.reduce(
    (acc, e) => acc + (toMin(e.end_time) - toMin(e.start_time)),
    0
  );
  const totalHoursLabel =
    totalMinutes === 0
      ? "0h"
      : `${(totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1)} heures`;

  const morning = dayEvents.filter((e) => toMin(e.start_time) < 12 * 60);
  const afternoon = dayEvents.filter(
    (e) =>
      toMin(e.start_time) >= 12 * 60 && toMin(e.start_time) < 18 * 60
  );
  const evening = dayEvents.filter((e) => toMin(e.start_time) >= 18 * 60);

  const monthLabel = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const getSubject = (id: string | null) =>
    subjects.find((s) => s.id === id);

  const renderGroup = (
    label: string,
    icon: React.ReactNode,
    items: CalendarEvent[]
  ) => (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1">—</p>
      ) : (
        <div className="space-y-2">
          {items.map((e, idx) => {
            const subject = getSubject(e.subject_id);
            const name = subject?.name || e.title;
            const color = getCourseColor(name);
            const teacher =
              e.teacher_name || subject?.teacher_name || "";
            return (
              <motion.button
                key={e.id}
                onClick={() => onEventClick?.(e)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 active:scale-[0.99] transition-transform"
                style={{
                  backgroundColor: "#F8F8F8",
                  borderLeft: `3px solid ${color.hex}`,
                }}
              >
                <span
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                  style={{ borderColor: "#CFCFCF" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm leading-tight truncate">
                    {name}
                  </p>
                  {teacher && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {teacher}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#EFEFEF", color: "#5B5B5B" }}
                >
                  {durationLabel(e.start_time, e.end_time)}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-32 calendar-scroll-container">
        {/* Header */}
        <div className="pt-2">
          <div className="flex items-end gap-2 flex-wrap">
            <h1
              className="font-display font-bold text-foreground lowercase"
              style={{ fontSize: 28, lineHeight: 1.1 }}
            >
              aujourd'hui
            </h1>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#EFEFEF", color: "#5B5B5B" }}
            >
              {dayEvents.length} cours
            </span>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#EFEFEF", color: "#5B5B5B" }}
            >
              {totalHoursLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-3 capitalize">
            {monthLabel}
          </p>
        </div>

        {/* Week strip */}
        <div className="mt-3 grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const sel = isSelected(d);
            return (
              <button
                key={d.toISOString()}
                onClick={() => onSelectDay(d)}
                className={cn(
                  "flex flex-col items-center py-2 rounded-2xl transition-all",
                  sel ? "" : "hover:bg-accent/40"
                )}
                style={
                  sel
                    ? {
                        backgroundColor: "#1A1A1A",
                        color: "#FFFFFF",
                      }
                    : undefined
                }
              >
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide font-semibold",
                    sel ? "" : "text-muted-foreground"
                  )}
                >
                  {DAY_LABELS_FR[d.getDay()]}
                </span>
                <span
                  className={cn(
                    "text-sm font-bold mt-0.5",
                    sel ? "" : isToday(d) ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Time groups */}
        <div className="mt-6">
          {renderGroup("Matin", <Sun className="w-4 h-4" />, morning)}
          {renderGroup(
            "Après-midi",
            <Sun className="w-4 h-4" />,
            afternoon
          )}
          {renderGroup("Soir", <Moon className="w-4 h-4" />, evening)}
        </div>
      </div>

      {/* Floating bottom dock */}
      <div className="absolute left-0 right-0 bottom-4 flex justify-center pointer-events-none">
        <div
          className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-full shadow-2xl"
          style={{ backgroundColor: "#1A1A1A" }}
        >
          {[
            { icon: Search, label: "Rechercher" },
            { icon: CheckSquare, label: "Valider" },
            { icon: Pencil, label: "Éditer" },
            { icon: Plus, label: "Ajouter" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition"
            >
              <Icon className="w-[18px] h-[18px]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
