import { useState, useMemo } from "react";
import { startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { useTimelineTasks } from "@/hooks/useTimelineTasks";
import { TimelineFullScreen } from "./TimelineFullScreen";

export const TimelineWidget = () => {
  const { tasks } = useTimelineTasks();
  const [isOpen, setIsOpen] = useState(false);

  const weekCount = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { locale: fr, weekStartsOn: 1 });
    const end = endOfWeek(now, { locale: fr, weekStartsOn: 1 });
    return tasks.filter(t => {
      const d = new Date(t.scheduled_at);
      return d >= start && d <= end;
    }).length;
  }, [tasks]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-[rgba(255,124,92,0.08)] group w-full"
        style={{ color: '#FF7C5C' }}
      >
        <span>📅 Timeline{weekCount > 0 ? ` (${weekCount})` : ''} →</span>
      </button>

      <TimelineFullScreen open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
