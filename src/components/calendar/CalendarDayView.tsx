import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { GlassCard } from "@/components/GlassCard";
import { Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  subjects: Subject[];
  onBack: () => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export const CalendarDayView = ({
  date,
  events,
  subjects,
  onBack,
  onEventClick,
}: CalendarDayViewProps) => {
  const dayEvents = events
    .filter(e => e.day_of_week === date.getDay())
    .sort((a, b) => {
      const [aH, aM] = a.start_time.split(':').map(Number);
      const [bH, bM] = b.start_time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });

  const getSubject = (subjectId: string | null) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getSubjectBorderColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      math: 'border-l-primary',
      history: 'border-l-warning',
      physics: 'border-l-success',
      english: 'border-l-[hsl(280,67%,55%)]',
      chemistry: 'border-l-destructive',
    };
    return colorMap[colorKey] || 'border-l-warning';
  };

  const getSubjectBgColor = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      math: 'bg-primary/5',
      history: 'bg-warning/10',
      physics: 'bg-success/5',
      english: 'bg-[hsl(280,67%,55%)]/5',
      chemistry: 'bg-destructive/5',
    };
    return colorMap[colorKey] || 'bg-warning/10';
  };

  // Generate time slots from 08:00 to 20:00
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="rounded-full h-9 w-9"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <h2 className="font-display font-semibold text-foreground text-lg">
            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
        </div>
      </div>

      {/* Timeline View */}
      <div className="relative space-y-0 overflow-y-auto max-h-[calc(100vh-350px)]">
        {timeSlots.map(hour => {
          const hourEvents = dayEvents.filter(e => {
            const [startHour] = e.start_time.split(':').map(Number);
            return startHour === hour;
          });

          return (
            <div key={hour} className="flex gap-3 min-h-[56px]">
              {/* Time Label */}
              <div className="w-12 text-sm text-muted-foreground font-medium pt-0 flex-shrink-0">
                {hour.toString().padStart(2, '0')}:00
              </div>

              {/* Events or Empty Slot */}
              <div className="flex-1 border-l border-border/50 pl-3 pb-2">
                {hourEvents.length > 0 ? (
                  <div className="space-y-2">
                    {hourEvents.map(event => {
                      const subject = getSubject(event.subject_id);
                      const colorKey = subject?.color_key || 'history';
                      
                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className={cn(
                            "w-full text-left rounded-xl p-3 border-l-4 transition-all hover:scale-[1.01]",
                            getSubjectBorderColor(colorKey),
                            getSubjectBgColor(colorKey)
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {subject && (
                              <span className="text-xl">{subject.icon}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground">
                                {subject?.name || event.title}
                              </h3>
                              
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[1px]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Events Message */}
      {dayEvents.length === 0 && (
        <GlassCard variant="subtle" className="p-6 text-center">
          <p className="text-muted-foreground">No classes scheduled for this day</p>
        </GlassCard>
      )}
    </div>
  );
};
