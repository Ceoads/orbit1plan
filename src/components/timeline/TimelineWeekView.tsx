import { useMemo, useRef, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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

const ORBIT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  study: { bg: 'rgba(155, 135, 245, 0.15)', text: '#7c5ce0', border: '#9b87f5', glow: 'rgba(155, 135, 245, 0.25)' },
  sport: { bg: 'rgba(45, 212, 160, 0.12)', text: '#1a9e74', border: '#2dd4a0', glow: 'rgba(45, 212, 160, 0.2)' },
  personal: { bg: 'rgba(255, 159, 107, 0.15)', text: '#d4713a', border: '#ff9f6b', glow: 'rgba(255, 159, 107, 0.2)' },
  other: { bg: 'rgba(91, 164, 245, 0.12)', text: '#3b7fd4', border: '#5ba4f5', glow: 'rgba(91, 164, 245, 0.2)' },
};

export const TimelineWeekView = ({
  tasks, weekStart, onWeekChange, onTaskClick, onAddTask, categoryFilter
}: Props) => {
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const pillsScrollRef = useRef<HTMLDivElement>(null);

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
        gridScrollRef.current.scrollTop = Math.max(0, (h - 7) * PX_PER_HOUR);
      }
    }
  }, []);

  // Sync pills + grid horizontal scroll on mobile
  const handleGridScroll = () => {
    if (gridScrollRef.current && pillsScrollRef.current) {
      pillsScrollRef.current.scrollLeft = gridScrollRef.current.scrollLeft;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Month + Navigation Header */}
      <motion.div 
        className="flex items-center justify-between px-5 py-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-bold text-foreground capitalize">
            {format(weekStart, 'MMMM yyyy', { locale: fr })}
          </h2>
          <motion.button 
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-foreground text-background"
            onClick={() => onWeekChange(startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 }))}
          >
            Auj.
          </motion.button>
          <motion.button whileTap={{ scale: 0.8, x: -2 }} onClick={() => onWeekChange(subWeeks(weekStart, 1))} className="p-1.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.8, x: 2 }} onClick={() => onWeekChange(addWeeks(weekStart, 1))} className="p-1.5 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Day Header Pills - synced horizontal scroll */}
      <div 
        className="flex pb-2.5 overflow-x-auto scrollbar-hide scroll-smooth"
        ref={pillsScrollRef}
        style={{ scrollbarWidth: 'none' }}
      >
        {/* GMT spacer */}
        <div className="w-12 flex-shrink-0 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground font-medium opacity-50 -rotate-90 whitespace-nowrap">
            GMT+{-(new Date().getTimezoneOffset() / 60)}
          </span>
        </div>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const hasTasks = getTasksForDay(day).length > 0;
          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.045, type: 'spring' as const, stiffness: 350, damping: 22 }}
              className="flex-1 flex flex-col items-center py-2.5 rounded-2xl mx-0.5 min-w-[120px] sm:min-w-0 relative"
              style={{ 
                background: isToday 
                  ? 'linear-gradient(145deg, rgba(155,135,245,0.18), rgba(255,159,107,0.12))' 
                  : 'hsl(var(--muted) / 0.3)'
              }}
            >
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {format(day, 'EEE', { locale: fr })}
              </span>
              <motion.span 
                className={`text-xl font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}
                animate={isToday ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
              >
                {format(day, 'd')}
              </motion.span>
              {/* Task count dot */}
              {hasTasks && (
                <motion.div 
                  className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary/60"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 + 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div 
        className="flex-1 overflow-auto border-t border-border/20" 
        ref={gridScrollRef}
        onScroll={handleGridScroll}
      >
        <div className="flex" style={{ minHeight: HOURS.length * PX_PER_HOUR }}>
          {/* Hour labels - sticky left */}
          <div className="w-12 flex-shrink-0 sticky left-0 z-10 bg-background/95 backdrop-blur-sm">
            {HOURS.map((hour, i) => (
              <motion.div 
                key={hour} 
                className="flex items-start justify-end pr-2 pt-1" 
                style={{ height: PX_PER_HOUR }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.015, duration: 0.25 }}
              >
                <span className="text-[11px] text-muted-foreground/60 font-medium tabular-nums">
                  {hour > 12 ? `${hour - 12} pm` : hour === 12 ? '12 pm' : `${hour} am`}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1 min-w-0">
            {weekDays.map((day, dayIndex) => {
              const dayTasks = getTasksForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className="flex-1 relative border-l border-border/10 min-w-[120px] sm:min-w-0"
                >
                  {/* Today column glow */}
                  {isToday && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none z-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                      style={{ background: 'linear-gradient(180deg, rgba(155,135,245,0.06) 0%, transparent 50%)' }}
                    />
                  )}

                  {/* Hour grid lines */}
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="border-t border-border/8 cursor-pointer hover:bg-accent/5 active:bg-accent/10 transition-colors"
                      style={{ height: PX_PER_HOUR }}
                      onClick={() => onAddTask(hour, day)}
                    />
                  ))}

                  {/* Task blocks with staggered entrance */}
                  <AnimatePresence mode="popLayout">
                    {dayTasks.map((task, i) => {
                      const d = new Date(task.scheduled_at);
                      const h = d.getHours();
                      const m = d.getMinutes();
                      const top = (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
                      const height = Math.max(34, (task.estimated_duration / 60) * PX_PER_HOUR);
                      const colors = ORBIT_COLORS[task.category] || ORBIT_COLORS.other;
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8, y: 8 }}
                          animate={{ 
                            opacity: task.completed ? 0.4 : 1, 
                            scale: 1, 
                            y: 0,
                          }}
                          exit={{ opacity: 0, scale: 0.85, y: -4 }}
                          transition={{ 
                            delay: dayIndex * 0.03 + i * 0.05,
                            type: 'spring' as const, 
                            stiffness: 350, 
                            damping: 24 
                          }}
                          whileHover={{ 
                            scale: 1.06, 
                            zIndex: 30,
                            boxShadow: `0 8px 24px ${colors.glow}`,
                          }}
                          whileTap={{ scale: 0.95 }}
                          className="absolute left-1 right-1 rounded-xl p-2 cursor-pointer overflow-hidden z-10"
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
                          {height >= 46 && (
                            <p className="text-[9px] mt-0.5 opacity-55 font-medium" style={{ color: colors.text }}>
                              {format(d, 'H:mm')} - {format(new Date(d.getTime() + task.estimated_duration * 60000), 'H:mm')}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Current time indicator with pulse */}
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
                          transition={{ delay: 0.6, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <div className="flex items-center">
                            <motion.div 
                              className="w-3 h-3 rounded-full bg-destructive -ml-1.5 shadow-md"
                              animate={{ 
                                scale: [1, 1.4, 1],
                                boxShadow: [
                                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                                  '0 0 0 6px rgba(239, 68, 68, 0)',
                                  '0 0 0 0 rgba(239, 68, 68, 0)',
                                ]
                              }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-destructive to-destructive/20" />
                          </div>
                        </motion.div>
                      );
                    }
                    return null;
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
