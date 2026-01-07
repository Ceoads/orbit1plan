import { useState } from "react";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { GlassCard } from "@/components/GlassCard";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarDayView } from "./CalendarDayView";
import { Clock, CalendarDays, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = 'today' | 'daily' | 'monthly';

interface ScheduleCalendarProps {
  events: CalendarEvent[];
  subjects: Subject[];
  onStudyFocus?: (event: CalendarEvent) => void;
}

export const ScheduleCalendar = ({
  events,
  subjects,
  onStudyFocus,
}: ScheduleCalendarProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('daily');
  };

  const handleBackToMonthly = () => {
    setViewMode('monthly');
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
    setViewMode('daily');
  };

  // Count stats
  const weeklyClassCount = new Set(
    events.filter(e => e.event_type === 'class').map(e => e.day_of_week)
  ).size;
  
  const upcomingExamCount = events.filter(e => {
    if (e.event_type !== 'exam' || !e.exam_date) return false;
    return new Date(e.exam_date) >= new Date();
  }).length;

  const ViewButton = ({ 
    mode, 
    icon: Icon, 
    label 
  }: { 
    mode: ViewMode; 
    icon: React.ComponentType<{ className?: string }>; 
    label: string;
  }) => (
    <button
      onClick={() => mode === 'today' ? handleGoToToday() : setViewMode(mode)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
        viewMode === mode || (mode === 'today' && viewMode === 'daily')
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex items-center justify-center gap-1 p-1 bg-muted/50 rounded-2xl">
        <ViewButton mode="today" icon={Clock} label="Today" />
        <ViewButton mode="daily" icon={CalendarDays} label="Day" />
        <ViewButton mode="monthly" icon={Calendar} label="Month" />
      </div>

      {/* Calendar Views */}
      <GlassCard className="p-5">
        {viewMode === 'monthly' && (
          <CalendarMonthView
            events={events}
            subjects={subjects}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={() => {}}
          />
        )}

        {viewMode === 'daily' && (
          <CalendarDayView
            date={selectedDate}
            events={events}
            subjects={subjects}
            onBack={handleBackToMonthly}
            onEventClick={onStudyFocus}
          />
        )}
      </GlassCard>

      {/* Stats Footer */}
      {viewMode === 'monthly' && (
        <div className="grid grid-cols-2 gap-4">
          <GlassCard variant="subtle" className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {events.filter(e => e.event_type === 'class').length}
            </p>
            <p className="text-xs text-muted-foreground">Weekly Classes</p>
          </GlassCard>
          <GlassCard variant="subtle" className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {upcomingExamCount}
            </p>
            <p className="text-xs text-muted-foreground">Upcoming Exams</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
