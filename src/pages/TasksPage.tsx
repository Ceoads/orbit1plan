import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Plus, Zap, Sun, Moon, CheckCircle2, Sparkles } from "lucide-react";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { cn } from "@/lib/utils";

type EnergyFilter = 'all' | 'high' | 'medium' | 'low';

const SPRING = { type: "spring" as const, stiffness: 320, damping: 22 };

const DAY_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_LETTER_FR = ["D", "L", "M", "M", "J", "V", "S"];
const MONTH_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export const TasksPage = () => {
  const { user } = useAuth();
  const { tasks, subjects, toggleTask, createTask, getUpcomingExams } = useOrbitData();
  const haptics = useHaptics();

  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>('all');
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // Scroll-reactive header
  const { scrollY } = useScroll();
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    return scrollY.on("change", (v) => setIsCompact(v > 40));
  }, [scrollY]);

  const briefingOpacity = useTransform(scrollY, [0, 60], [1, 0]);
  const briefingY = useTransform(scrollY, [0, 80], [0, -16]);

  // Week strip (Mon-Sun) around today
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay(); // 0 Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + mondayOffset + i);
      return d;
    });
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter tasks for selected day + energy
  const dayTasks = useMemo(() => {
    const dayStart = new Date(selectedDay);
    const dayEnd = new Date(selectedDay);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return tasks
      .filter(t => !t.is_subtask)
      .filter(t => energyFilter === 'all' || t.energy_level === energyFilter)
      .filter(t => {
        if (!t.due_date) {
          // Show undated tasks only on today
          return selectedDay.getTime() === today.getTime();
        }
        const due = new Date(t.due_date);
        return due >= dayStart && due < dayEnd;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'todo' ? -1 : 1;
        const at = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bt = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        if (at !== bt) return at - bt;
        return b.priority_score - a.priority_score;
      });
  }, [tasks, selectedDay, energyFilter]);

  const todoCount = dayTasks.filter(t => t.status === 'todo').length;
  const doneCount = dayTasks.filter(t => t.status === 'done').length;
  const examsCount = getUpcomingExams().length;

  const firstName = (user?.user_metadata as any)?.first_name
    || (user?.user_metadata as any)?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'toi';

  const dayLabel = DAY_SHORT_FR[selectedDay.getDay()];
  const isToday = selectedDay.getTime() === today.getTime();

  const energyFilters = [
    { id: 'all' as const, label: 'Tous', icon: null },
    { id: 'high' as const, label: 'Max', icon: Zap },
    { id: 'medium' as const, label: 'Moyen', icon: Sun },
    { id: 'low' as const, label: 'Zen', icon: Moon },
  ];

  const handleToggle = (id: string) => {
    haptics.success();
    toggleTask(id);
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
          background: "linear-gradient(to bottom, hsl(var(--background)) 70%, hsl(var(--background) / 0))",
        }}
      >
        {/* Top row: Day + date stack */}
        <motion.div layout transition={SPRING} className="flex items-start justify-between">
          <motion.div layout transition={SPRING} className="flex items-center gap-2">
            <h1
              className="font-display font-bold tracking-tight text-foreground leading-none"
              style={{ fontSize: isCompact ? 32 : 48, transition: "font-size 0.3s ease" }}
            >
              {dayLabel}
            </h1>
            <motion.span
              layout
              className="rounded-full bg-primary"
              style={{ width: isCompact ? 8 : 12, height: isCompact ? 8 : 12 }}
              transition={SPRING}
            />
          </motion.div>
          <div className="text-right leading-tight">
            <p className="text-sm text-muted-foreground font-medium">
              {MONTH_FR[selectedDay.getMonth()]} {selectedDay.getDate()}
            </p>
            <p className="text-xs text-muted-foreground/70">{selectedDay.getFullYear()}</p>
          </div>
        </motion.div>

        {/* Expanded briefing */}
        <AnimatePresence initial={false}>
          {!isCompact && (
            <motion.div
              key="briefing"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={SPRING}
              style={{ opacity: briefingOpacity, y: briefingY }}
              className="overflow-hidden"
            >
              <p className="mt-4 text-[19px] leading-snug text-muted-foreground/70 font-medium">
                <span className="text-foreground font-semibold">{greeting}, {firstName}.</span>{" "}
                Tu as <span className="text-foreground font-semibold">{todoCount} tâche{todoCount > 1 ? 's' : ''}</span>
                {examsCount > 0 && (
                  <> et <span className="text-foreground font-semibold">{examsCount} examen{examsCount > 1 ? 's' : ''}</span> à venir</>
                )}.{" "}
                {todoCount === 0
                  ? <span className="text-foreground font-semibold">Tu es libre aujourd'hui.</span>
                  : <>Reste concentré{todoCount > 3 ? ', ça va passer.' : '.'}</>
                }
              </p>

              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-foreground font-semibold">{todoCount}</span> à faire
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-foreground font-semibold">{doneCount}</span> terminé{doneCount > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-foreground font-semibold">{examsCount}</span> examen{examsCount > 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Week strip */}
        <motion.div layout transition={SPRING} className="mt-4 flex items-center justify-between">
          {weekDays.map((d, i) => {
            const isSelected = d.getTime() === selectedDay.getTime();
            const isPast = d < today;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                onClick={() => { haptics.selection(); setSelectedDay(d); }}
                className="relative flex flex-col items-center gap-1 px-2 py-1 hit-target"
              >
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  isSelected ? "text-foreground" : isPast ? "text-muted-foreground/40" : "text-muted-foreground/70"
                )}>
                  {DAY_LETTER_FR[d.getDay()]}
                </span>
                <span className={cn(
                  "text-base font-bold tabular-nums",
                  isSelected ? "text-foreground" : isPast ? "text-muted-foreground/40" : "text-muted-foreground/80"
                )}>
                  {d.getDate()}
                </span>
                {isSelected && (
                  <motion.span
                    layoutId="day-indicator"
                    transition={SPRING}
                    className="absolute -bottom-1 h-1 w-6 rounded-full bg-primary"
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </motion.header>

      {/* ENERGY FILTERS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
      >
        {energyFilters.map(({ id, label, icon: Icon }) => {
          const active = energyFilter === id;
          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => { haptics.selection(); setEnergyFilter(id); }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-foreground/[0.04] text-muted-foreground border border-foreground/5"
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* TASK LIST */}
      <motion.div
        layout
        className="mt-5 rounded-3xl bg-card/60 backdrop-blur-sm overflow-hidden"
        style={{ boxShadow: "0 8px 30px rgb(0 0 0 / 0.03)" }}
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
              <p className="text-foreground font-semibold">Rien de prévu {isToday ? "aujourd'hui" : "ce jour"} 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Touche + pour ajouter une tâche
              </p>
            </motion.div>
          ) : (
            dayTasks.map((task, i) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.96 }}
                transition={{ ...SPRING, delay: i * 0.04 }}
                className={cn(
                  "relative flex items-center gap-4 px-5 py-4",
                  i !== 0 && "before:content-[''] before:absolute before:top-0 before:left-5 before:right-5 before:border-t before:border-dotted before:border-foreground/10"
                )}
              >
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.08 }}
                  transition={SPRING}
                  onClick={() => handleToggle(task.id)}
                  className={cn(
                    "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    task.status === 'done'
                      ? "bg-primary/15 border-primary"
                      : "border-foreground/20 hover:border-primary"
                  )}
                >
                  <AnimatePresence>
                    {task.status === 'done' && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={SPRING}
                        className="block w-2.5 h-2.5 rounded-full bg-primary"
                      />
                    )}
                  </AnimatePresence>
                </motion.button>

                <div className="flex-1 min-w-0">
                  <motion.p
                    animate={{
                      opacity: task.status === 'done' ? 0.45 : 1,
                    }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "font-semibold text-foreground text-[15px] leading-snug truncate relative",
                      task.status === 'done' && "line-through decoration-foreground/40"
                    )}
                  >
                    {task.title}
                  </motion.p>
                </div>

                <span className="shrink-0 text-xs font-medium text-muted-foreground/70 tabular-nums">
                  {task.due_date
                    ? new Date(task.due_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* FLOATING ACTION BUTTON */}
      <motion.button
        initial={{ opacity: 0, y: 30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
        transition={SPRING}
        onClick={() => { haptics.impact(); setShowAddModal(true); }}
        className="fixed left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center backdrop-blur-md"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)",
          boxShadow: "0 12px 32px hsl(var(--primary) / 0.35), 0 2px 8px hsl(var(--primary) / 0.2)",
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
