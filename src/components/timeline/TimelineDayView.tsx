import { useMemo, useState } from "react";
import { format, isSameDay, addDays, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type TimelineTask, CATEGORY_COLORS } from "@/hooks/useTimelineTasks";

interface Props {
  tasks: TimelineTask[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAddTask: (hour?: number) => void;
  onTaskClick: (task: TimelineTask) => void;
  onToggleComplete: (id: string) => void;
  categoryFilter: string;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6h-22h

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
    const top = (h - 6) * 68 + (m / 60) * 68;
    const height = Math.max(48, (task.estimated_duration / 60) * 68);
    return { top, height };
  };

  // Find free slots (gaps >= 30min)
  const freeSlots = useMemo(() => {
    const sorted = [...dayTasks].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    const slots: { hour: number; top: number }[] = [];
    
    let lastEnd = 6 * 60; // 6am in minutes
    for (const task of sorted) {
      const d = new Date(task.scheduled_at);
      const taskStart = d.getHours() * 60 + d.getMinutes();
      if (taskStart - lastEnd >= 30) {
        const h = Math.floor(lastEnd / 60);
        slots.push({ hour: h, top: (h - 6) * 68 });
      }
      lastEnd = Math.max(lastEnd, taskStart + task.estimated_duration);
    }
    // Check end of day
    if (22 * 60 - lastEnd >= 30) {
      const h = Math.floor(lastEnd / 60);
      slots.push({ hour: h, top: (h - 6) * 68 });
    }
    return slots;
  }, [dayTasks]);

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="flex flex-col h-full">
      {/* Day Navigation */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => onDateChange(subDays(selectedDate, 1))} className="p-2 rounded-xl hover:bg-muted/50">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="text-center">
          <h3 className="font-display font-bold text-foreground capitalize">
            {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </h3>
          {isToday && <span className="text-xs text-primary font-medium">Aujourd'hui</span>}
        </div>
        <button onClick={() => onDateChange(addDays(selectedDate, 1))} className="p-2 rounded-xl hover:bg-muted/50">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Timeline */}
      {dayTasks.length === 0 && freeSlots.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
          <span className="text-4xl">🎉</span>
          <p className="text-muted-foreground font-medium">Aucune tâche prévue</p>
          <p className="text-sm text-muted-foreground">Profite de ta journée !</p>
          <button
            onClick={() => onAddTask()}
            className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
          >
            Ajouter une tâche
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 relative" style={{ minHeight: HOURS.length * 68 }}>
          {/* Hour labels + grid */}
          {HOURS.map(hour => (
            <div key={hour} className="flex items-start" style={{ height: 68 }}>
              <div className="w-14 flex-shrink-0 text-right pr-3 pt-0.5">
                <span className="text-xs text-muted-foreground font-medium">
                  {hour}:00
                </span>
              </div>
              <div className="flex-1 border-t border-border/30 h-full" />
            </div>
          ))}

          {/* Task blocks */}
          <AnimatePresence>
            {dayTasks.map((task, i) => {
              const { top, height } = getTaskPosition(task);
              const color = CATEGORY_COLORS[task.category] || '#ff9f6b';
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: task.completed ? 0.5 : 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="absolute left-16 right-3 rounded-2xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    top,
                    height: Math.max(height, 48),
                    backgroundColor: `${color}20`,
                    borderLeft: `3px solid ${color}`,
                  }}
                  onClick={() => onTaskClick(task)}
                >
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${task.completed ? 'line-through' : ''}`} style={{ color }}>
                        {task.icon} {task.title}
                      </p>
                      {height >= 56 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {task.estimated_duration >= 60
                            ? `${Math.floor(task.estimated_duration / 60)}h${task.estimated_duration % 60 ? task.estimated_duration % 60 : ''}`
                            : `${task.estimated_duration}m`
                          } • {format(new Date(task.scheduled_at), 'HH:mm')}
                        </p>
                      )}
                      {height >= 72 && task.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate italic">"{task.note}"</p>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onToggleComplete(task.id); }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        task.completed ? 'bg-green-500 text-white' : 'border-2 hover:bg-muted/50'
                      }`}
                      style={!task.completed ? { borderColor: color } : {}}
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
              className="absolute left-16 right-3 h-10 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
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
              const top = (h - 6) * 68 + (m / 60) * 68;
              return (
                <div className="absolute left-12 right-0 flex items-center z-20" style={{ top }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <div className="flex-1 h-px bg-destructive" />
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
};
