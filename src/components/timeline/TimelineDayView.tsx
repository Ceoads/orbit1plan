import { useMemo, useRef, useEffect } from "react";
import { format, isSameDay, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type TimelineTask } from "@/hooks/useTimelineTasks";

interface Props {
  tasks: TimelineTask[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddTask: (hour?: number) => void;
  onTaskClick: (task: TimelineTask) => void;
  onToggleComplete: (id: string) => void;
  categoryFilter: string;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const PX_PER_HOUR = 80;

const ORBIT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  study: { bg: 'rgba(155, 135, 245, 0.18)', text: '#7c5ce0', border: '#9b87f5', glow: 'rgba(155, 135, 245, 0.3)' },
  sport: { bg: 'rgba(45, 212, 160, 0.15)', text: '#1a9e74', border: '#2dd4a0', glow: 'rgba(45, 212, 160, 0.25)' },
  personal: { bg: 'rgba(255, 159, 107, 0.18)', text: '#d4713a', border: '#ff9f6b', glow: 'rgba(255, 159, 107, 0.25)' },
  other: { bg: 'rgba(91, 164, 245, 0.15)', text: '#3b7fd4', border: '#5ba4f5', glow: 'rgba(91, 164, 245, 0.25)' },
};

export const TimelineDayView = ({
  tasks, selectedDate, onDateChange, onAddTask, onTaskClick, onToggleComplete, categoryFilter
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const dayTasks = useMemo(() => {
    return tasks
      .filter(t => isSameDay(new Date(t.scheduled_at), selectedDate))
      .filter(t => categoryFilter === 'all' || t.category === categoryFilter);
  }, [tasks, selectedDate, categoryFilter]);

  // Auto-scroll to current time
  useEffect(() => {
    if (scrollRef.current && isSameDay(selectedDate, new Date())) {
      const h = new Date().getHours();
      if (h >= 6 && h <= 22) {
        scrollRef.current.scrollTop = Math.max(0, (h - 7) * PX_PER_HOUR);
      }
    }
  }, [selectedDate]);

  const getTaskPosition = (task: TimelineTask) => {
    const d = new Date(task.scheduled_at);
    const h = d.getHours();
    const m = d.getMinutes();
    const top = (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
    const height = Math.max(52, (task.estimated_duration / 60) * PX_PER_HOUR);
    return { top, height };
  };

  const freeSlots = useMemo(() => {
    const sorted = [...dayTasks].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    const slots: { hour: number; top: number }[] = [];
    let lastEnd = 6 * 60;
    for (const task of sorted) {
      const d = new Date(task.scheduled_at);
      const taskStart = d.getHours() * 60 + d.getMinutes();
      if (taskStart - lastEnd >= 30) {
        const h = Math.floor(lastEnd / 60);
        slots.push({ hour: h, top: (h - 6) * PX_PER_HOUR });
      }
      lastEnd = Math.max(lastEnd, taskStart + task.estimated_duration);
    }
    if (22 * 60 - lastEnd >= 30) {
      const h = Math.floor(lastEnd / 60);
      slots.push({ hour: h, top: (h - 6) * PX_PER_HOUR });
    }
    return slots;
  }, [dayTasks]);

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Day Navigation with spring animation on date change */}
      <motion.div 
        className="flex items-center justify-between px-5 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button 
          whileTap={{ scale: 0.8, x: -4 }}
          onClick={() => onDateChange(subDays(selectedDate, 1))} 
          className="p-2 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </motion.button>
        <motion.div 
          className="text-center"
          key={selectedDate.toISOString()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 300, damping: 22 }}
        >
          <h3 className="font-display font-bold text-lg text-foreground capitalize">
            {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </h3>
          {isToday && (
            <motion.span 
              className="text-xs text-primary font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              Aujourd'hui
            </motion.span>
          )}
        </motion.div>
        <motion.button 
          whileTap={{ scale: 0.8, x: 4 }}
          onClick={() => onDateChange(addDays(selectedDate, 1))} 
          className="p-2 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </motion.div>

      {/* Empty state with playful animation */}
      {dayTasks.length === 0 && freeSlots.length === 0 ? (
        <motion.div 
          className="flex-1 flex flex-col items-center justify-center gap-4 py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' as const, stiffness: 200, damping: 20 }}
        >
          <motion.span 
            className="text-6xl"
            animate={{ 
              rotate: [0, -10, 10, -5, 0],
              y: [0, -6, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🎉
          </motion.span>
          <p className="text-muted-foreground font-semibold text-lg">Aucune tâche prévue</p>
          <p className="text-sm text-muted-foreground/70">Profite de ta journée !</p>
          <motion.button
            onClick={() => onAddTask()}
            className="mt-3 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(155,135,245,0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Ajouter une tâche
            </span>
          </motion.button>
        </motion.div>
      ) : (
        <div className="flex-1 overflow-y-auto relative border-t border-border/20" ref={scrollRef}>
          <div className="relative" style={{ minHeight: HOURS.length * PX_PER_HOUR }}>
            {/* Hour labels + grid with staggered fade-in */}
            {HOURS.map((hour, i) => (
              <motion.div 
                key={hour} 
                className="flex items-start" 
                style={{ height: PX_PER_HOUR }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.012, duration: 0.2 }}
              >
                <div className="w-14 flex-shrink-0 text-right pr-3 pt-1">
                  <span className="text-[11px] text-muted-foreground/60 font-medium tabular-nums">
                    {hour > 12 ? `${hour - 12} pm` : hour === 12 ? '12 pm' : `${hour} am`}
                  </span>
                </div>
                <div className="flex-1 border-t border-border/15 h-full" />
              </motion.div>
            ))}

            {/* Task blocks with rich spring animations */}
            <AnimatePresence mode="popLayout">
              {dayTasks.map((task, i) => {
                const { top, height } = getTaskPosition(task);
                const colors = ORBIT_COLORS[task.category] || ORBIT_COLORS.other;
                const d = new Date(task.scheduled_at);
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.92 }}
                    animate={{ 
                      opacity: task.completed ? 0.4 : 1, 
                      x: 0, 
                      scale: 1,
                    }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ 
                      delay: i * 0.06,
                      type: 'spring' as const, 
                      stiffness: 320, 
                      damping: 22 
                    }}
                    whileHover={{ 
                      scale: 1.02, 
                      x: 4,
                      boxShadow: `0 8px 28px ${colors.glow}`,
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="absolute left-16 right-4 rounded-2xl p-3.5 cursor-pointer overflow-hidden"
                    style={{
                      top,
                      height: Math.max(height, 52),
                      backgroundColor: colors.bg,
                      borderLeft: `3.5px solid ${colors.border}`,
                      boxShadow: `0 2px 10px ${colors.glow}`,
                    }}
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${task.completed ? 'line-through' : ''}`} style={{ color: colors.text }}>
                          {task.title}
                        </p>
                        {height >= 60 && (
                          <p className="text-xs mt-0.5 opacity-65" style={{ color: colors.text }}>
                            {format(d, 'H:mm')} - {format(new Date(d.getTime() + task.estimated_duration * 60000), 'H:mm')}
                          </p>
                        )}
                        {height >= 80 && task.note && (
                          <p className="text-[11px] mt-1 opacity-45 truncate italic" style={{ color: colors.text }}>
                            "{task.note}"
                          </p>
                        )}
                      </div>
                      <motion.button
                        onClick={e => { e.stopPropagation(); onToggleComplete(task.id); }}
                        whileTap={{ scale: 0.75, rotate: task.completed ? 0 : 360 }}
                        whileHover={{ scale: 1.15 }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-2 transition-colors ${
                          task.completed ? 'text-white' : 'border-2 hover:bg-white/20'
                        }`}
                        style={task.completed ? { backgroundColor: colors.border } : { borderColor: colors.border }}
                      >
                        {task.completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' as const, stiffness: 500, damping: 15 }}
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Free slots with breathing animation */}
            {freeSlots.map((slot, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary))' }}
                whileTap={{ scale: 0.98 }}
                className="absolute left-16 right-4 h-10 rounded-xl border-2 border-dashed border-border/25 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent/5 transition-colors"
                style={{ top: slot.top }}
                onClick={() => onAddTask(slot.hour)}
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </motion.button>
            ))}

            {/* Current time indicator with pulsing dot */}
            {isToday && (() => {
              const now = new Date();
              const h = now.getHours();
              const m = now.getMinutes();
              if (h >= 6 && h <= 22) {
                const top = (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
                return (
                  <motion.div 
                    className="absolute left-12 right-0 flex items-center z-20 pointer-events-none" 
                    style={{ top }}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-destructive shadow-md"
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
                    <div className="flex-1 h-[2px] bg-gradient-to-r from-destructive to-destructive/10" />
                  </motion.div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
