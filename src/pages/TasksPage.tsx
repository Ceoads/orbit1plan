import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, PanInfo, useMotionValue, animate } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 320, damping: 28 };
const SNAP = { type: "spring" as const, stiffness: 360, damping: 34 };

const DAY_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_3_FR = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const MONTH_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const mondayOf = (d: Date) => {
  const x = startOfDay(d);
  const dow = x.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  return x;
};

const buildWeek = (monday: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

export const TasksPage = () => {
  const { user } = useAuth();
  const { tasks, subjects, toggleTask, createTask, getUpcomingExams } = useOrbitData();
  const haptics = useHaptics();
  const sounds = useSoundEffects();

  const today = useMemo(() => startOfDay(new Date()), []);
  const anchorMonday = useMemo(() => mondayOf(today), [today]);

  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const stripRef = useRef<HTMLDivElement>(null);
  const [stripWidth, setStripWidth] = useState(0);
  useEffect(() => {
    const update = () => setStripWidth(stripRef.current?.offsetWidth ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Scroll-reactive header
  const { scrollY } = useScroll();
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => scrollY.on("change", (v) => setIsCompact(v > 40)), [scrollY]);
  const briefingOpacity = useTransform(scrollY, [0, 60], [1, 0]);

  // Three visible weeks
  const visibleWeeks = useMemo(() => {
    return [-1, 0, 1].map((delta) => {
      const m = new Date(anchorMonday);
      m.setDate(m.getDate() + (weekOffset + delta) * 7);
      return { offset: weekOffset + delta, days: buildWeek(m) };
    });
  }, [anchorMonday, weekOffset]);

  const goToWeek = (newOffset: number) => {
    setWeekOffset(newOffset);
    haptics.selection();
    sounds.select();
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 60;
    const velocityThreshold = 400;
    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      goToWeek(weekOffset + 1);
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      goToWeek(weekOffset - 1);
    }
  };

  // Filter tasks for selected day
  const dayTasks = useMemo(() => {
    const dayStart = new Date(selectedDay);
    const dayEnd = new Date(selectedDay);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return tasks
      .filter((t) => !t.is_subtask)
      .filter((t) => {
        if (!t.due_date) return selectedDay.getTime() === today.getTime();
        const due = new Date(t.due_date);
        return due >= dayStart && due < dayEnd;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
        const at = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bt = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        if (at !== bt) return at - bt;
        return b.priority_score - a.priority_score;
      });
  }, [tasks, selectedDay, today]);

  const todoCount = dayTasks.filter((t) => t.status === "todo").length;
  const doneCount = dayTasks.filter((t) => t.status === "done").length;
  const examsCount = getUpcomingExams().length;

  const firstName =
    (user?.user_metadata as any)?.first_name ||
    (user?.user_metadata as any)?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "toi";

  const dayLabel = DAY_SHORT_FR[selectedDay.getDay()];
  const isToday = selectedDay.getTime() === today.getTime();

  const handleToggle = (id: string) => {
    haptics.success();
    sounds.success();
    toggleTask(id);
  };

  const handlePickDay = (d: Date) => {
    haptics.selection();
    sounds.tap();
    setSelectedDay(d);
  };

  const handleOpenAdd = () => {
    haptics.soft();
    sounds.open();
    setShowAddModal(true);
  };

  const handleAdd = async (data: any) => {
    await createTask({
      title: data.title,
      energy_level: data.energy_level,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
      subject_id: data.subject_id,
      priority_score: data.priority_score,
    });
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  })();

  return (
    <div className="-mt-6 pb-20">
      {/* HEADER */}
      <motion.header
        layout
        transition={SPRING}
        className="sticky top-0 z-30 -mx-4 px-4 pt-3 pb-3 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background)) 70%, hsl(var(--background) / 0))",
        }}
      >
        <motion.div layout transition={SPRING} className="flex items-start justify-between">
          <motion.div layout transition={SPRING} className="flex items-end gap-1.5">
            <h1
              className="font-display font-bold tracking-tight text-foreground leading-[0.9]"
              style={{ fontSize: isCompact ? 36 : 56, transition: "font-size 0.3s ease" }}
            >
              {dayLabel}
            </h1>
            <span
              className="text-primary font-bold leading-none"
              style={{ fontSize: isCompact ? 36 : 56 }}
            >
              .
            </span>
          </motion.div>
          <div className="text-right leading-tight pt-1">
            <p className="text-sm text-muted-foreground font-medium">
              {selectedDay.getDate()} {MONTH_FR[selectedDay.getMonth()]}
            </p>
            <p className="text-xs text-muted-foreground/70">{selectedDay.getFullYear()}</p>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {!isCompact && (
            <motion.div
              key="briefing"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={SPRING}
              style={{ opacity: briefingOpacity }}
              className="overflow-hidden"
            >
              <p className="mt-4 text-[18px] leading-snug text-muted-foreground/80 font-medium">
                <span className="text-foreground font-semibold">
                  {greeting}, {firstName}.
                </span>{" "}
                Tu as{" "}
                <span className="text-foreground font-semibold">
                  {todoCount} tâche{todoCount > 1 ? "s" : ""}
                </span>
                {examsCount > 0 && (
                  <>
                    {" "}et{" "}
                    <span className="text-foreground font-semibold">
                      {examsCount} examen{examsCount > 1 ? "s" : ""}
                    </span>
                  </>
                )}{" "}
                {isToday ? "aujourd'hui" : "ce jour"}.
              </p>

              <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-foreground font-semibold">{todoCount}</span> items
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  <span className="text-foreground font-semibold">{doneCount}</span> terminées
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SWIPEABLE WEEK STRIP */}
        <div className="mt-5 relative">
          <div
            ref={stripRef}
            className="overflow-hidden"
            style={{ touchAction: "pan-y" }}
          >
            <motion.div
              className="flex"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={handleDragEnd}
              animate={{ x: -stripWidth }}
              transition={SNAP}
              key={weekOffset}
              initial={{ x: -stripWidth }}
            >
              {visibleWeeks.map(({ offset, days }) => (
                <div
                  key={offset}
                  className="flex items-center justify-between shrink-0"
                  style={{ width: stripWidth }}
                >
                  {days.map((d) => {
                    const isSelected = d.getTime() === selectedDay.getTime();
                    const isPast = d < today;
                    const isCurrentDay = d.getTime() === today.getTime();
                    return (
                      <motion.button
                        key={d.toISOString()}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePickDay(d)}
                        className="relative flex flex-col items-center gap-1.5 px-1 py-1.5 hit-target flex-1"
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.08em]",
                            isSelected
                              ? "text-foreground"
                              : isPast
                              ? "text-muted-foreground/35"
                              : "text-muted-foreground/60"
                          )}
                        >
                          {DAY_3_FR[d.getDay()]}
                        </span>
                        <span
                          className={cn(
                            "text-[22px] font-bold tabular-nums leading-none",
                            isSelected
                              ? "text-foreground"
                              : isPast
                              ? "text-muted-foreground/35"
                              : isCurrentDay
                              ? "text-primary"
                              : "text-muted-foreground/80"
                          )}
                        >
                          {d.getDate()}
                        </span>
                        <span className="h-1.5 w-1.5">
                          {isSelected && (
                            <motion.span
                              layoutId={`day-dot-${offset}`}
                              transition={SPRING}
                              className="block w-1.5 h-1.5 rounded-full bg-primary"
                            />
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Edge chevron taps (subtle) */}
          <button
            onClick={() => goToWeek(weekOffset - 1)}
            aria-label="Semaine précédente"
            className="absolute -left-1 top-1/2 -translate-y-1/2 p-1 opacity-0 hover:opacity-60 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => goToWeek(weekOffset + 1)}
            aria-label="Semaine suivante"
            className="absolute -right-1 top-1/2 -translate-y-1/2 p-1 opacity-0 hover:opacity-60 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </motion.header>

      {/* TASK LIST */}
      <motion.div
        layout
        className="mt-5 rounded-3xl bg-card overflow-hidden"
        style={{ boxShadow: "0 8px 30px rgb(0 0 0 / 0.04)" }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {dayTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="py-16 px-6 text-center"
            >
              <p className="text-foreground font-semibold">
                Rien de prévu {isToday ? "aujourd'hui" : "ce jour"} 🎉
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Touche + pour ajouter une tâche
              </p>
            </motion.div>
          ) : (
            dayTasks.map((task, i) => {
              const subject = subjects.find((s) => s.id === task.subject_id);
              const hasIcon = !!subject?.icon && task.status === "todo";
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.96 }}
                  transition={{ ...SPRING, delay: i * 0.035 }}
                  className={cn(
                    "relative flex items-center gap-4 px-5 py-4",
                    i !== 0 &&
                      "before:content-[''] before:absolute before:top-0 before:left-5 before:right-5 before:border-t before:border-dotted before:border-foreground/10"
                  )}
                >
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.08 }}
                    transition={SPRING}
                    onClick={() => handleToggle(task.id)}
                    className={cn(
                      "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                      hasIcon
                        ? "text-xl"
                        : task.status === "done"
                        ? "border-2 bg-primary/15 border-primary"
                        : "border-2 border-foreground/20 hover:border-primary"
                    )}
                  >
                    {hasIcon ? (
                      <span>{subject!.icon}</span>
                    ) : (
                      <AnimatePresence>
                        {task.status === "done" && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={SPRING}
                            className="block w-2.5 h-2.5 rounded-full bg-primary"
                          />
                        )}
                      </AnimatePresence>
                    )}
                  </motion.button>

                  <div className="flex-1 min-w-0">
                    <motion.p
                      animate={{ opacity: task.status === "done" ? 0.45 : 1 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "font-semibold text-foreground text-[15px] leading-snug truncate",
                        task.status === "done" && "line-through decoration-foreground/40"
                      )}
                    >
                      {task.title}
                    </motion.p>
                  </div>

                  <span className="shrink-0 text-xs font-medium text-muted-foreground/70 tabular-nums">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* FAB */}
      <motion.button
        initial={{ opacity: 0, y: 30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
        transition={SPRING}
        onClick={handleOpenAdd}
        className="fixed left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center backdrop-blur-md"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)",
          boxShadow:
            "0 12px 32px hsl(var(--primary) / 0.35), 0 2px 8px hsl(var(--primary) / 0.2)",
        }}
        aria-label="Ajouter une tâche"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </motion.button>

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
        subjects={subjects}
      />
    </div>
  );
};
