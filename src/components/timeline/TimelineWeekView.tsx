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
  const headerText = `Semaine du ${format(weekStart, 'd')} au ${format(weekEnd, 'd MMMM', { locale: fr })}`;

  return (
    <div className="flex flex-col h-full">
      {/* Week Navigation */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => onWeekChange(subWeeks(weekStart, 1))} className="p-2 rounded-xl hover:bg-muted/50">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h3 className="font-display font-bold text-sm text-foreground capitalize">{headerText}</h3>
        <button onClick={() => onWeekChange(addWeeks(weekStart, 1))} className="p-2 rounded-xl hover:bg-muted/50">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="flex border-b border-border/30 px-2">
        <div className="w-12 flex-shrink-0" />
        {weekDays.map(day => {
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className="flex-1 text-center py-2 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase">{format(day, 'EEE', { locale: fr })}</p>
              <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex relative" style={{ minHeight: HOURS.length * 48 }}>
          {/* Hour labels */}
          <div className="w-12 flex-shrink-0">
            {HOURS.map(hour => (
              <div key={hour} className="h-12 flex items-start justify-end pr-2 pt-0.5">
                <span className="text-[10px] text-muted-foreground">{hour}h</span>
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
                className={`flex-1 relative border-l border-border/20 min-w-0 ${isToday ? 'bg-primary/5' : ''}`}
              >
                {/* Hour grid lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-12 border-t border-border/15 cursor-pointer hover:bg-muted/20"
                    onClick={() => onAddTask(hour, day)}
                  />
                ))}

                {/* Task blocks */}
                {dayTasks.map(task => {
                  const d = new Date(task.scheduled_at);
                  const h = d.getHours();
                  const m = d.getMinutes();
                  const top = (h - 6) * 48 + (m / 60) * 48;
                  const height = Math.max(24, (task.estimated_duration / 60) * 48);
                  const color = CATEGORY_COLORS[task.category] || '#ff9f6b';
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: task.completed ? 0.4 : 1 }}
                      className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 cursor-pointer overflow-hidden hover:z-10 hover:shadow-sm transition-shadow"
                      style={{
                        top,
                        height,
                        backgroundColor: `${color}25`,
                        borderLeft: `3px solid ${color}`,
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      <p className={`text-[11px] font-medium truncate ${task.completed ? 'line-through' : ''}`} style={{ color }}>
                        {task.icon} {task.title}
                      </p>
                      {height >= 36 && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {format(new Date(task.scheduled_at), 'HH:mm')}
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
                        className="absolute left-0 right-0 h-px bg-destructive z-20"
                        style={{ top: (h - 6) * 48 + (m / 60) * 48 }}
                      >
                        <div className="w-2 h-2 rounded-full bg-destructive -translate-y-1/2 -translate-x-1" />
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
