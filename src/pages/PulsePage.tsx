import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 320, damping: 22 };
const SOFT_SPRING = { type: "spring" as const, stiffness: 260, damping: 26 };

const DAY_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_FULL_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTH_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const getGreetingFR = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
};

const getWeekDays = (ref: Date) => {
  // Monday-first week
  const day = ref.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ref);
    d.setDate(ref.getDate() + offset + i);
    return d;
  });
};

export const PulsePage = () => {
  const { user } = useAuth();
  const { tasks, getTodayEvents, toggleTask, createTask, subjects } = useOrbitData();
  const haptics = useHaptics();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Scroll-reactive header
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => {
    setExpanded(v < 24);
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const selectedStr = selectedDate.toISOString().split("T")[0];
  const isToday = todayStr === selectedStr;

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const todayEvents = getTodayEvents?.() || [];

  // Combine today's events + open tasks into a single chronological list
  const listItems = useMemo(() => {
    const eventItems = todayEvents.map((e) => ({
      kind: "event" as const,
      id: e.id,
      title: e.title,
      time: e.start_time?.slice(0, 5) || "",
      sortKey: e.start_time || "99:99",
      done: false,
      icon: subjects.find((s) => s.id === e.subject_id)?.icon || "📚",
    }));
    const taskItems = tasks
      .filter((t) => !t.is_subtask)
      .map((t) => ({
        kind: "task" as const,
        id: t.id,
        title: t.title,
        time: t.due_date ? new Date(t.due_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "",
        sortKey: t.due_date || "zz",
        done: t.status === "done",
        icon: "✦",
      }));
    return [...eventItems, ...taskItems].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [todayEvents, tasks, subjects]);

  const openTaskCount = tasks.filter((t) => t.status === "todo" && !t.is_subtask).length;
  const eventCount = todayEvents.length;
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] || "toi";

  const handleToggle = async (id: string) => {
    haptics.selection();
    await toggleTask(id);
  };

  return (
    <div className="-mt-6 -mx-4">
      {/* ===== HEADER ===== */}
      <motion.header
        layout
        transition={SPRING}
        className="px-6 pt-4 pb-3 sticky top-0 z-20 backdrop-blur-xl bg-[hsl(var(--background)/0.72)]"
        style={{ borderBottom: "1px solid hsl(var(--border) / 0.4)" }}
      >
        {/* Day label + date stack */}
        <motion.div layout className="flex items-start justify-between">
          <div className="flex items-baseline gap-1">
            <h1
              className="font-display font-bold tracking-tight text-foreground leading-none"
              style={{ fontSize: expanded ? 56 : 34, transition: "font-size 0.35s cubic-bezier(0.4,0,0.2,1)" }}
            >
              {DAY_SHORT_FR[selectedDate.getDay()]}
            </h1>
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block rounded-full bg-primary"
              style={{ width: expanded ? 12 : 8, height: expanded ? 12 : 8, marginLeft: 2, marginBottom: 6 }}
            />
          </div>

          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-muted-foreground">
              {selectedDate.getDate()} {MONTH_FR[selectedDate.getMonth()]}
            </p>
            <p className="text-sm text-muted-foreground/70">{selectedDate.getFullYear()}</p>
          </div>
        </motion.div>

        {/* Expanded briefing */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="briefing"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={SPRING}
              className="overflow-hidden"
            >
              <div className="pt-5 pb-2">
                <p className="text-[22px] leading-snug font-display tracking-tight text-muted-foreground">
                  {getGreetingFR()},{" "}
                  <span className="text-foreground font-semibold">{firstName}</span>.{" "}
                  Tu as{" "}
                  <span className="text-foreground font-semibold">{eventCount} cours</span>
                  {" "}et{" "}
                  <span className="text-foreground font-semibold">{openTaskCount} tâches</span>
                  {" "}aujourd'hui.
                </p>

                <div className="flex items-center gap-5 mt-4 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="text-primary">●</span> {eventCount + openTaskCount} items</span>
                  <span className="flex items-center gap-1.5"><span className="text-foreground/40">●</span> {tasks.filter(t => t.status === "done").length} terminées</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Week strip */}
        <motion.div layout transition={SPRING} className="flex justify-between items-center pt-3 pb-1">
          {weekDays.map((d, i) => {
            const isSel = d.toDateString() === selectedDate.toDateString();
            const isPast = d < today && !isSel && d.toDateString() !== today.toDateString();
            return (
              <motion.button
                key={i}
                onClick={() => { haptics.selection(); setSelectedDate(d); }}
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-1 py-1 px-2 relative hit-target"
              >
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  isSel ? "text-foreground" : "text-muted-foreground/60"
                )}>
                  {DAY_SHORT_FR[d.getDay()]}
                </span>
                <span className={cn(
                  "text-base font-display font-bold",
                  isSel ? "text-foreground" : isPast ? "text-muted-foreground/40" : "text-muted-foreground/80"
                )}>
                  {d.getDate()}
                </span>
                {isSel && (
                  <motion.div
                    layoutId="weekActive"
                    transition={SPRING}
                    className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </motion.header>

      {/* ===== TASK / EVENT LIST ===== */}
      <motion.section
        className="mx-4 mt-4 mb-32 rounded-3xl bg-card/80 backdrop-blur-sm overflow-hidden"
        style={{ boxShadow: "0 8px 30px -10px hsl(20 30% 20% / 0.08)" }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
        }}
      >
        <AnimatePresence mode="popLayout">
          {listItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 text-center"
            >
              <p className="text-sm text-muted-foreground">Aucun élément aujourd'hui ✨</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Profite de ta journée libre</p>
            </motion.div>
          ) : (
            listItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: SOFT_SPRING },
                }}
                exit={{ opacity: 0, x: 30, transition: { duration: 0.25 } }}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 relative",
                  idx > 0 && "border-t border-dotted border-foreground/8"
                )}
                style={idx > 0 ? { borderTopStyle: "dotted", borderTopColor: "hsl(var(--foreground) / 0.08)" } : {}}
              >
                {item.kind === "task" ? (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                    transition={SPRING}
                    onClick={() => handleToggle(item.id)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors",
                      item.done
                        ? "bg-primary/15 border-primary"
                        : "border-foreground/20 hover:border-primary"
                    )}
                  >
                    <AnimatePresence>
                      {item.done && (
                        <motion.span
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={SPRING}
                        >
                          <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ) : (
                  <span className="w-6 h-6 flex items-center justify-center text-base shrink-0">
                    {item.icon}
                  </span>
                )}

                <motion.p
                  animate={{
                    opacity: item.done ? 0.4 : 1,
                    textDecoration: item.done ? "line-through" : "none",
                  }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 text-[15px] font-medium text-foreground truncate"
                >
                  {item.title}
                </motion.p>

                {item.time && (
                  <span className="text-xs font-medium text-muted-foreground/60 tabular-nums shrink-0">
                    {item.time}
                  </span>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.section>

      {/* ===== FAB ===== */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.4 }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
        onClick={() => { haptics.medium(); setShowAddTask(true); }}
        className="fixed z-30 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
          background: "hsl(var(--primary))",
          boxShadow: "0 12px 32px -8px hsl(var(--primary) / 0.5), 0 4px 12px -2px hsl(var(--primary) / 0.3)",
        }}
        aria-label="Ajouter une tâche"
      >
        <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
      </motion.button>

      <AddTaskModal
        open={showAddTask}
        onOpenChange={setShowAddTask}
        subjects={subjects}
        onTaskAdded={() => refetch()}
      />
    </div>
  );
};
