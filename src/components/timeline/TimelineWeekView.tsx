import { useMemo, useRef, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type TimelineTask, CATEGORY_COLORS } from "@/hooks/useTimelineTasks";

interface Props {
  tasks: TimelineTask[];
  weekStart: Date;
  onWeekChange: (date: Date) => void;
  onTaskClick: (task: TimelineTask) => void;
  onAddTask: (hour?: number, date?: Date) => void;
  categoryFilter: string;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const PX_PER_HOUR = 72;
const DAY_COL_WIDTH = 140; // Fixed column width on mobile

const ORBIT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  study: { bg: 'rgba(155, 135, 245, 0.15)', text: '#7c5ce0', border: '#9b87f5', glow: 'rgba(155, 135, 245, 0.25)' },
  sport: { bg: 'rgba(45, 212, 160, 0.12)', text: '#1a9e74', border: '#2dd4a0', glow: 'rgba(45, 212, 160, 0.2)' },
  personal: { bg: 'rgba(255, 159, 107, 0.15)', text: '#d4713a', border: '#ff9f6b', glow: 'rgba(255, 159, 107, 0.2)' },
  other: { bg: 'rgba(91, 164, 245, 0.12)', text: '#3b7fd4', border: '#5ba4f5', glow: 'rgba(91, 164, 245, 0.2)' },
};

// Stagger animation variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.02 }
  }
};

const taskVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 6 },
  visible: { 
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }
};

const dayPillVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }
  })
};

export const TimelineWeekView = ({
  tasks, weekStart, onWeekChange, onTaskClick, onAddTask, categoryFilter
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
  [weekStart]);

  const filteredTasks = useMemo(() =>
    tasks.filter(t => categoryFilter === 'all' || t.category === categoryFilter),
  [tasks, categoryFilter]);

  const getTasksForDay = (day: Date) =>
    filteredTasks.filter(t => isSameDay(new Date(t.scheduled_at), day));

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (gridScrollRef.current) {
      const now = new Date();
      const h = now.getHours();
      if (h >= 6 && h <= 22) {
        const scrollTo = Math.max(0, (h - 7) * PX_PER_HOUR);
        gridScrollRef.current.scrollTop = scrollTo;
      }
    }
  }, []);

  // Scroll to today's column on mobile
  useEffect(() => {
    if (scrollRef.current) {
      const todayIndex = weekDays.findIndex(d => isSameDay(d, new Date()));
      if (todayIndex > 0) {
        const scrollTo = Math.max(0, (todayIndex - 1) * DAY_COL_WIDTH);
        scrollRef.current.scrollLeft = scrollTo;
      }
    }
  }, [weekDays]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Month + Navigation Header */}
      <motion.div 
        className="flex items-center justify-between px-5 py-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-bold text-foreground capitalize">
            {format(weekStart, 'MMMM yyyy', { locale: fr })}
          </h2>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-foreground text-background"
            onClick={() => onWeekChange(startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 }))}
          >
            Auj.
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => onWeekChange(subWeeks(weekStart, 1))} className="p-1.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => onWeekChange(addWeeks(weekStart, 1))} className="p-1.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Day Header Pills - horizontal scroll on mobile */}
      <div className="flex pb-2.5 overflow-x-auto scrollbar-hide" ref={scrollRef}>
        {/* Timezone / spacer */}
        <div className="w-12 flex-shrink-0 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground font-medium opacity-60 -rotate-90 whitespace-nowrap">
            GMT+{-(new Date().getTimezoneOffset() / 60)}
          </span>
        </div>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          return (
            <motion.div
              key={day.toISOString()}
              custom={i}
              variants={dayPillVariants}
              initial="hidden"
              animate="visible"
              className={`flex-shrink-0 flex flex-col items-center py-2.5 px-1 rounded-2xl transition-all mx-0.5
                sm:flex-1 sm:min-w-0`}
              style={{ 
                minWidth: `${DAY_COL_WIDTH - 4}px`,
                background: isToday 
                  ? 'linear-gradient(135deg, rgba(155,135,245,0.15), rgba(255,159,107,0.1))' 
                  : 'hsl(var(--muted) / 0.35)'
              }}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {format(day, 'EEE', { locale: fr })}
              </span>
              <motion.span 
                className={`text-xl font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}
                animate={isToday ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {format(day, 'd')}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Time Grid - scrolls both horizontally (mobile) and vertically */}
      <div className="flex-1 overflow-auto border-t border-border/20" ref={gridScrollRef}>
        <div className="flex" style={{ minHeight: HOURS.length * PX_PER_HOUR }}>
          {/* Hour labels - sticky left */}
          <div className="w-12 flex-shrink-0 sticky left-0 z-10 bg-background">
            {HOURS.map(hour => (
              <div key={hour} className="flex items-start justify-end pr-2 pt-1" style={{ height: PX_PER_HOUR }}>
                <span className="text-[11px] text-muted-foreground/70 font-medium tabular-nums">
                  {hour > 12 ? `${hour - 12} pm` : hour === 12 ? '12 pm' : `${hour} am`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns - scroll horizontally on mobile */}
          <div className="flex overflow-x-auto scrollbar-hide sm:flex-1">
            <motion.div 
              className="flex"
              style={{ minWidth: 'max-content' }}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {weekDays.map((day, dayIndex) => {
                const dayTasks = getTasksForDay(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className="relative border-l border-border/15"
                    style={{ width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH }}
                  >
                    {/* Today column highlight */}
                    {isToday && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ background: 'linear-gradient(180deg, rgba(155,135,245,0.04) 0%, transparent 40%)' }}
                      />
                    )}

                    {/* Hour grid lines */}
                    {HOURS.map(hour => (
                      <div
                        key={hour}
                        className="border-t border-border/10 cursor-pointer hover:bg-accent/5 active:bg-accent/10 transition-colors"
                        style={{ height: PX_PER_HOUR }}
                        onClick={() => onAddTask(hour, day)}
                      />
                    ))}

                    {/* Task blocks */}
                    <AnimatePresence>
                      {dayTasks.map((task, i) => {
                        const d = new Date(task.scheduled_at);
                        const h = d.getHours();
                        const m = d.getMinutes();
                        const top = (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
                        const height = Math.max(32, (task.estimated_duration / 60) * PX_PER_HOUR);
                        const colors = ORBIT_COLORS[task.category] || ORBIT_COLORS.other;
                        return (
                          <motion.div
                            key={task.id}
                            variants={taskVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            whileHover={{ scale: 1.04, zIndex: 30 }}
                            whileTap={{ scale: 0.97 }}
                            className="absolute left-1.5 right-1.5 rounded-xl p-2 cursor-pointer overflow-hidden z-10"
                            style={{
                              top,
                              height,
                              backgroundColor: colors.bg,
                              borderLeft: `3px solid ${colors.border}`,
                              boxShadow: `0 2px 8px ${colors.glow}`,
                            }}
                            onClick={() => onTaskClick(task)}
                          >
                            <p
                              className={`text-[11px] font-semibold leading-tight truncate ${task.completed ? 'line-through opacity-50' : ''}`}
                              style={{ color: colors.text }}
                            >
                              {task.title}
                            </p>
                            {height >= 44 && (
                              <p className="text-[9px] mt-0.5 opacity-60 font-medium" style={{ color: colors.text }}>
                                {format(d, 'H:mm')} - {format(new Date(d.getTime() + task.estimated_duration * 60000), 'H:mm')}
                              </p>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Current time indicator */}
                    {isToday && (() => {
                      const now = new Date();
                      const h = now.getHours();
                      const m = now.getMinutes();
                      if (h >= 6 && h <= 22) {
                        return (
                          <motion.div
                            className="absolute left-0 right-0 z-20 pointer-events-none"
                            style={{ top: (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR }}
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                          >
                            <div className="flex items-center">
                              <motion.div 
                                className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1 shadow-sm"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              <div className="flex-1 h-[2px] bg-destructive/80" />
                            </div>
                          </motion.div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
