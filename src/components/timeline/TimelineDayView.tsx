import { useMemo } from "react";
import { format, isSameDay, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
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

const ORBIT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  study: { bg: 'rgba(155, 135, 245, 0.18)', text: '#7c5ce0', border: '#9b87f5' },
  sport: { bg: 'rgba(45, 212, 160, 0.15)', text: '#1a9e74', border: '#2dd4a0' },
  personal: { bg: 'rgba(255, 159, 107, 0.18)', text: '#d4713a', border: '#ff9f6b' },
  other: { bg: 'rgba(91, 164, 245, 0.15)', text: '#3b7fd4', border: '#5ba4f5' },
};

export const TimelineDayView = ({
  tasks, selectedDate, onDateChange, onAddTask, onTaskClick, onToggleComplete, categoryFilter
}: Props) => {
  const dayTasks = useMemo(() => {
    return tasks
      .filter(t => isSameDay(new Date(t.scheduled_at), selectedDate))
      .filter(t => categoryFilter === 'all' || t.category === categoryFilter);
  }, [tasks, selectedDate, categoryFilter]);

  const getTaskPosition = (task: TimelineTask) => {
    const d = new Date(task.scheduled_at);
    const h = d.getHours();
    const m = d.getMinutes();
    const top = (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
    const height = Math.max(48, (task.estimated_duration / 60) * PX_PER_HOUR);
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
      {/* Day Navigation - matching reference style */}
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => onDateChange(subDays(selectedDate, 1))} className="p-2 rounded-xl hover:bg-muted/50">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="text-center">
          <h3 className="font-display font-bold text-lg text-foreground capitalize">
            {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </h3>
          {isToday && <span className="text-xs text-primary font-semibold">Aujourd'hui</span>}
        </div>
        <button onClick={() => onDateChange(addDays(selectedDate, 1))} className="p-2 rounded-xl hover:bg-muted/50">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Timeline */}
      {dayTasks.length === 0 && freeSlots.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
          <span className="text-5xl">🎉</span>
          <p className="text-muted-foreground font-semibold text-lg">Aucune tâche prévue</p>
          <p className="text-sm text-muted-foreground">Profite de ta journée !</p>
          <button
            onClick={() => onAddTask()}
            className="mt-3 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            Ajouter une tâche
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto relative border-t border-border/30">
          <div className="relative" style={{ minHeight: HOURS.length * PX_PER_HOUR }}>
            {/* Hour labels + grid */}
            {HOURS.map(hour => (
              <div key={hour} className="flex items-start" style={{ height: PX_PER_HOUR }}>
                <div className="w-14 flex-shrink-0 text-right pr-3 pt-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {hour > 12 ? `${hour - 12} pm` : hour === 12 ? '12 pm' : `${hour} am`}
                  </span>
                </div>
                <div className="flex-1 border-t border-border/20 h-full" />
              </div>
            ))}

            {/* Task blocks */}
            <AnimatePresence>
              {dayTasks.map((task, i) => {
                const { top, height } = getTaskPosition(task);
                const colors = ORBIT_COLORS[task.category] || ORBIT_COLORS.other;
                const d = new Date(task.scheduled_at);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: task.completed ? 0.45 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="absolute left-16 right-4 rounded-2xl p-3.5 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
                    style={{
                      top,
                      height: Math.max(height, 48),
                      backgroundColor: colors.bg,
                      borderLeft: `3px solid ${colors.border}`,
                    }}
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${task.completed ? 'line-through' : ''}`} style={{ color: colors.text }}>
                          {task.title}
                        </p>
                        {height >= 56 && (
                          <p className="text-xs mt-0.5 opacity-70" style={{ color: colors.text }}>
                            {format(d, 'H:mm')} - {format(new Date(d.getTime() + task.estimated_duration * 60000), 'H:mm')}
                          </p>
                        )}
                        {height >= 76 && task.note && (
                          <p className="text-xs mt-1 opacity-50 truncate italic" style={{ color: colors.text }}>
                            "{task.note}"
                          </p>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onToggleComplete(task.id); }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-2 transition-all ${
                          task.completed ? 'text-white' : 'border-2 hover:bg-white/30'
                        }`}
                        style={task.completed ? { backgroundColor: colors.border } : { borderColor: colors.border }}
                      >
                        {task.completed && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Free slots */}
            {freeSlots.map((slot, i) => (
              <button
                key={i}
                className="absolute left-16 right-4 h-10 rounded-xl border-2 border-dashed border-border/30 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:bg-accent/10 transition-colors"
                style={{ top: slot.top }}
                onClick={() => onAddTask(slot.hour)}
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une tâche
              </button>
            ))}

            {/* Current time indicator */}
            {isToday && (() => {
              const now = new Date();
              const h = now.getHours();
              const m = now.getMinutes();
              if (h >= 6 && h <= 22) {
                const top = (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
                return (
                  <div className="absolute left-12 right-0 flex items-center z-20 pointer-events-none" style={{ top }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                    <div className="flex-1 h-[2px] bg-destructive" />
                  </div>
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
