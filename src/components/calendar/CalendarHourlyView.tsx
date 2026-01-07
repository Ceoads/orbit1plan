import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { GlassCard } from "@/components/GlassCard";
import { Clock, MapPin, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CalendarHourlyViewProps {
  events: CalendarEvent[];
  subjects: Subject[];
  onStudyFocus?: (event: CalendarEvent) => void;
}

export const CalendarHourlyView = ({
  events,
  subjects,
  onStudyFocus,
}: CalendarHourlyViewProps) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const currentDay = now.getDay();

  const todayEvents = events
    .filter(e => e.day_of_week === currentDay && e.event_type === 'class')
    .sort((a, b) => {
      const [aH, aM] = a.start_time.split(':').map(Number);
      const [bH, bM] = b.start_time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });

  const getSubject = (subjectId: string | null) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getSubjectColors = (colorKey: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      math: { bg: 'bg-primary', border: 'border-primary', text: 'text-primary-foreground' },
      history: { bg: 'bg-warning', border: 'border-warning', text: 'text-warning-foreground' },
      physics: { bg: 'bg-success', border: 'border-success', text: 'text-success-foreground' },
      english: { bg: 'bg-[hsl(280,67%,55%)]', border: 'border-[hsl(280,67%,55%)]', text: 'text-white' },
      chemistry: { bg: 'bg-destructive', border: 'border-destructive', text: 'text-destructive-foreground' },
    };
    return colorMap[colorKey] || colorMap.math;
  };

  const isCurrentEvent = (event: CalendarEvent) => {
    const [startH, startM] = event.start_time.split(':').map(Number);
    const [endH, endM] = event.end_time.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    return currentTime >= startTime && currentTime <= endTime;
  };

  const isUpcoming = (event: CalendarEvent) => {
    const [startH, startM] = event.start_time.split(':').map(Number);
    const startTime = startH * 60 + startM;
    return currentTime < startTime;
  };

  // Time slots from 08:00 to 20:00
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8);
  const HOUR_HEIGHT = 80; // pixels per hour

  const getEventPosition = (event: CalendarEvent) => {
    const [startH, startM] = event.start_time.split(':').map(Number);
    const [endH, endM] = event.end_time.split(':').map(Number);
    
    const startOffset = (startH - 8) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT;
    const duration = ((endH * 60 + endM) - (startH * 60 + startM)) / 60 * HOUR_HEIGHT;
    
    return { top: startOffset, height: Math.max(duration, 40) };
  };

  const currentTimePosition = ((currentHour - 8) * HOUR_HEIGHT) + ((currentMinute / 60) * HOUR_HEIGHT);

  return (
    <div className="space-y-4">
      {/* Today Header */}
      <div>
        <p className="text-sm text-muted-foreground">Today's Schedule</p>
        <h2 className="font-display font-semibold text-foreground">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
      </div>

      {/* Hourly Timeline */}
      <div className="relative overflow-y-auto max-h-[calc(100vh-280px)] rounded-2xl bg-white/50 backdrop-blur-sm">
        <div className="relative" style={{ height: `${13 * HOUR_HEIGHT}px` }}>
          {/* Time Labels */}
          {timeSlots.map(hour => (
            <div
              key={hour}
              className="absolute left-0 w-12 text-xs text-muted-foreground font-medium"
              style={{ top: `${(hour - 8) * HOUR_HEIGHT}px` }}
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}

          {/* Grid Lines */}
          {timeSlots.map(hour => (
            <div
              key={`line-${hour}`}
              className="absolute left-12 right-0 border-t border-border/30"
              style={{ top: `${(hour - 8) * HOUR_HEIGHT}px` }}
            />
          ))}

          {/* Current Time Indicator */}
          {currentHour >= 8 && currentHour < 21 && (
            <div
              className="absolute left-12 right-0 flex items-center z-20"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <div className="flex-1 h-0.5 bg-destructive" />
            </div>
          )}

          {/* Events */}
          <div className="absolute left-14 right-2">
            {todayEvents.map(event => {
              const subject = getSubject(event.subject_id);
              const colors = getSubjectColors(subject?.color_key || 'math');
              const position = getEventPosition(event);
              const isCurrent = isCurrentEvent(event);
              const upcoming = isUpcoming(event);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "absolute left-0 right-0 rounded-xl p-3 shadow-md transition-all overflow-hidden",
                    colors.bg,
                    colors.text,
                    isCurrent && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ top: `${position.top}px`, height: `${position.height}px` }}
                >
                  <div className="h-full flex flex-col">
                    <div className="flex items-start gap-2">
                      {subject && (
                        <span className="text-lg drop-shadow-sm">{subject.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {subject?.name || event.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs opacity-90">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                          </span>
                          
                          {event.room_number && (
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3" />
                              {event.room_number}
                            </span>
                          )}
                        </div>

                        {event.teacher_name && position.height > 60 && (
                          <span className="flex items-center gap-1 mt-1 text-xs opacity-80">
                            <User className="w-3 h-3" />
                            {event.teacher_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Study Focus Button */}
                    {isCurrent && onStudyFocus && position.height > 70 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-auto self-start bg-white/20 hover:bg-white/30 text-inherit border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStudyFocus(event);
                        }}
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        Study Focus
                      </Button>
                    )}
                  </div>

                  {/* Current Class Indicator */}
                  {isCurrent && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Now
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* No Classes Today */}
      {todayEvents.length === 0 && (
        <GlassCard variant="subtle" className="p-6 text-center">
          <p className="text-muted-foreground">No classes scheduled for today 🎉</p>
        </GlassCard>
      )}
    </div>
  );
};