import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
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
const PX_PER_HOUR = 80;

// Orbit-themed pastel colors for categories
const ORBIT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  study: { bg: 'rgba(155, 135, 245, 0.18)', text: '#7c5ce0', border: '#9b87f5' },
  sport: { bg: 'rgba(45, 212, 160, 0.15)', text: '#1a9e74', border: '#2dd4a0' },
  personal: { bg: 'rgba(255, 159, 107, 0.18)', text: '#d4713a', border: '#ff9f6b' },
  other: { bg: 'rgba(91, 164, 245, 0.15)', text: '#3b7fd4', border: '#5ba4f5' },
};

export const TimelineWeekView = ({
  tasks, weekStart, onWeekChange, onTaskClick, onAddTask, categoryFilter
}: Props) => {
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
  [weekStart]);

  const filteredTasks = useMemo(() =>
    tasks.filter(t => categoryFilter === 'all' || t.category === categoryFilter),
  [tasks, categoryFilter]);

  const getTasksForDay = (day: Date) =>
    filteredTasks.filter(t => isSameDay(new Date(t.scheduled_at), day));

  const weekEnd = addDays(weekStart, 6);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Month + Navigation Header - like the reference */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-bold text-foreground capitalize">
            {format(weekStart, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button className="px-3 py-1 text-xs font-semibold rounded-full bg-foreground text-background">
            Auj.
          </button>
          <button onClick={() => onWeekChange(subWeeks(weekStart, 1))} className="p-1 rounded-lg hover:bg-muted/50">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => onWeekChange(addWeeks(weekStart, 1))} className="p-1 rounded-lg hover:bg-muted/50">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Day Header Pills - like the reference image */}
      <div className="flex px-2 pb-3 gap-1.5">
        {/* Empty space for hour column */}
        <div className="w-14 flex-shrink-0" />
        {weekDays.map(day => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all min-w-0 ${
                isToday
                  ? 'bg-gradient-to-br from-accent/60 to-primary/10'
                  : 'bg-muted/40'
              }`}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {format(day, 'EEE', { locale: fr })}
              </span>
              <span className={`text-lg font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-auto border-t border-border/30">
        <div className="flex relative" style={{ minHeight: HOURS.length * PX_PER_HOUR }}>
          {/* Hour labels */}
          <div className="w-14 flex-shrink-0">
            {HOURS.map(hour => (
              <div key={hour} className="flex items-start justify-end pr-3 pt-1" style={{ height: PX_PER_HOUR }}>
                <span className="text-xs text-muted-foreground font-medium">
                  {hour > 12 ? `${hour - 12} pm` : hour === 12 ? '12 pm' : `${hour} am`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dayTasks = getTasksForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`flex-1 relative border-l border-border/20 min-w-0`}
              >
                {/* Hour grid lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="border-t border-border/15 cursor-pointer hover:bg-accent/10 transition-colors"
                    style={{ height: PX_PER_HOUR }}
                    onClick={() => onAddTask(hour, day)}
                  />
                ))}

                {/* Task blocks - styled like reference */}
                {dayTasks.map((task, i) => {
                  const d = new Date(task.scheduled_at);
                  const h = d.getHours();
                  const m = d.getMinutes();
                  const top = (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR;
                  const height = Math.max(36, (task.estimated_duration / 60) * PX_PER_HOUR);
                  const colors = ORBIT_COLORS[task.category] || ORBIT_COLORS.other;
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: task.completed ? 0.4 : 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="absolute left-1 right-1 rounded-xl p-2 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all overflow-hidden"
                      style={{
                        top,
                        height,
                        backgroundColor: colors.bg,
                        borderLeft: `3px solid ${colors.border}`,
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      <p
                        className={`text-[11px] font-semibold leading-tight truncate ${task.completed ? 'line-through' : ''}`}
                        style={{ color: colors.text }}
                      >
                        {task.title}
                      </p>
                      {height >= 48 && (
                        <p className="text-[10px] mt-0.5 opacity-70" style={{ color: colors.text }}>
                          {format(d, 'H:mm')} - {format(new Date(d.getTime() + task.estimated_duration * 60000), 'H:mm')}
                        </p>
                      )}
                    </motion.div>
                  );
                })}

                {/* Current time indicator */}
                {isToday && (() => {
                  const now = new Date();
                  const h = now.getHours();
                  const m = now.getMinutes();
                  if (h >= 6 && h <= 22) {
                    return (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: (h - 6) * PX_PER_HOUR + (m / 60) * PX_PER_HOUR }}
                      >
                        <div className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
                          <div className="flex-1 h-[2px] bg-destructive" />
                        </div>
                      </div>
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
  );
};
