import { useState } from "react";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { GlassCard } from "@/components/GlassCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarDayView } from "./CalendarDayView";
import { CalendarHourlyView } from "./CalendarHourlyView";
import { Calendar, CalendarDays, Clock } from "lucide-react";

type ViewMode = 'monthly' | 'daily' | 'hourly';

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
  const [viewMode, setViewMode] = useState<ViewMode>('hourly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('daily');
  };

  const handleBackToMonthly = () => {
    setViewMode('monthly');
  };

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <GlassCard variant="subtle" className="p-1">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="w-full grid grid-cols-3 bg-transparent gap-1">
            <TabsTrigger 
              value="hourly" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Today</span>
            </TabsTrigger>
            <TabsTrigger 
              value="daily" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl gap-1.5"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Day</span>
            </TabsTrigger>
            <TabsTrigger 
              value="monthly" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Month</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </GlassCard>

      {/* Calendar Views */}
      <GlassCard className="p-4">
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
          />
        )}

        {viewMode === 'hourly' && (
          <CalendarHourlyView
            events={events}
            subjects={subjects}
            onStudyFocus={onStudyFocus}
          />
        )}
      </GlassCard>
    </div>
  );
};