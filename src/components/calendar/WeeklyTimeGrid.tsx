import { useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { FilteredEvent } from "@/lib/eventFilter";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { getCourseColor } from "@/lib/courseColors";

interface WeeklyTimeGridProps {
  weekDays: Date[];
  events: (CalendarEvent | FilteredEvent)[];
  subjects: Subject[];
  getExamsOnDate: (date: Date) => CalendarEvent[];
  onExamClick: (exam: CalendarEvent) => void;
}

export const WeeklyTimeGrid = ({
  weekDays,
  events,
  subjects,
  getExamsOnDate,
  onExamClick,
}: WeeklyTimeGridProps) => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const sounds = useSoundEffects();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const timeSlots = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm
  }, []);

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (currentHour >= 8 && currentHour <= 20) {
        const scrollTarget = ((currentHour - 8) * 56) - 56; // Center the current hour
        scrollContainerRef.current.scrollTo({
          top: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });
      }
    }
  }, []);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getEventsForDayAndHour = (date: Date, hour: number): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter: only show events for today or future dates
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    if (eventDate < today) return [];
    
    return events.filter(e => {
      // Match by event_date if available, fallback to day_of_week
      const dateMatch = e.event_date ? e.event_date === dateStr : e.day_of_week === dayOfWeek;
      if (!dateMatch) return false;
      const [startHour] = e.start_time.split(':').map(Number);
      return startHour === hour;
    });
  };

  const getSubject = (subjectId: string | null) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getEventDuration = (event: CalendarEvent): number => {
    const [startH, startM] = event.start_time.split(':').map(Number);
    const [endH, endM] = event.end_time.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  const getSubjectColors = (colorKey: string): { bg: string; border: string; text: string } => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      math: { bg: 'bg-subject-math/20', border: 'border-subject-math', text: 'text-subject-math' },
      history: { bg: 'bg-subject-history/20', border: 'border-subject-history', text: 'text-subject-history' },
      physics: { bg: 'bg-subject-physics/20', border: 'border-subject-physics', text: 'text-subject-physics' },
      english: { bg: 'bg-subject-english/20', border: 'border-subject-english', text: 'text-subject-english' },
      chemistry: { bg: 'bg-subject-chemistry/20', border: 'border-subject-chemistry', text: 'text-subject-chemistry' },
    };
    return colorMap[colorKey] || { bg: 'bg-muted', border: 'border-muted-foreground', text: 'text-foreground' };
  };

  const handleExamClick = (exam: CalendarEvent) => {
    haptics.soft();
    sounds.open();
    onExamClick(exam);
  };

  const handleEventClick = (event: CalendarEvent) => {
    haptics.selection();
    sounds.tap();
    if (event.event_type === 'exam') {
      handleExamClick(event);
    } else {
      // Navigate to Course Hub page for classes
      navigate(`/course/${event.id}`);
    }
  };

  // Animation for day headers
  const dayHeaderVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05 },
    }),
  };

  // Current time indicator
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeOffset = ((currentHour - 8) * 60 + currentMinute) / 60;

  // Handle touch events to prevent propagation to parent
  const handleTouchStart = (e: React.TouchEvent) => {
    // Allow touch events inside the grid but mark as calendar interaction
    e.stopPropagation();
  };

  return (
    <div 
      className="h-full flex flex-col" 
      data-calendar-container
      onTouchStart={handleTouchStart}
    >
      {/* Day Headers with Exam Dots */}
      <div className="flex border-b border-border/30 pb-2 mb-2">
        {/* Time axis spacer */}
        <div className="w-12 flex-shrink-0" />
        
        {/* Day headers */}
        <div className="flex-1 grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const examsOnDay = getExamsOnDate(day);
            const hasExam = examsOnDay.length > 0;
            const today = isToday(day);
            
            return (
              <motion.div
                key={day.toISOString()}
                className="flex flex-col items-center"
                custom={index}
                variants={dayHeaderVariants}
                initial="hidden"
                animate="visible"
              >
                <span className={cn(
                  "text-[10px] font-medium uppercase",
                  today ? "text-primary" : "text-muted-foreground"
                )}>
                  {dayNames[index]}
                </span>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mt-1 transition-all",
                  "min-w-[44px] min-h-[44px] touch-manipulation",
                  today && "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                )}>
                  <span className={cn(
                    "text-sm font-semibold",
                    today ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {day.getDate()}
                  </span>
                </div>
                
                {/* Exam Dot Indicator with pulse animation */}
                {hasExam && (
                  <motion.button
                    onClick={() => handleExamClick(examsOnDay[0])}
                    className="mt-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    whileHover={{ scale: 1.4 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-warning shadow-lg shadow-warning/50 animate-exam-pulse" />
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Time Grid with iOS-style smooth scrolling */}
      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          "calendar-scroll-container",
          "scrollbar-ios"
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div className="relative">
          {/* Current Time Indicator */}
          {currentHour >= 8 && currentHour <= 20 && (
            <motion.div
              className="absolute left-12 right-0 z-20 pointer-events-none"
              style={{ top: `${currentTimeOffset * 56}px` }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-destructive shadow-lg shadow-destructive/50" />
                <div className="flex-1 h-0.5 bg-destructive/50" />
              </div>
            </motion.div>
          )}

          {/* Time Slots */}
          {timeSlots.map((hour, hourIndex) => (
            <motion.div
              key={hour}
              className="flex h-14"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + hourIndex * 0.02 }}
            >
              {/* Time Label */}
              <div className="w-12 flex-shrink-0 text-[10px] text-muted-foreground font-medium pr-2 text-right -mt-2">
                {hour.toString().padStart(2, '0')}:00
              </div>

              {/* Day Columns */}
              <div className="flex-1 grid grid-cols-7 gap-1 border-t border-border/20">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  
                  return (
                    <div key={day.toISOString()} className="relative min-h-full">
                      {dayEvents.map((event) => {
                        const subject = getSubject(event.subject_id);
                        const colorKey = subject?.color_key || 'history';
                        const colors = getSubjectColors(colorKey);
                        const duration = getEventDuration(event);
                        const heightMultiplier = duration / 60;
                        
                        return (
                          <motion.div
                            key={event.id}
                            className={cn(
                              "absolute inset-x-0 rounded-lg p-1.5 border-l-3 overflow-hidden cursor-pointer",
                              "active:scale-95 transition-transform shadow-sm touch-manipulation",
                              colors.bg,
                              colors.border
                            )}
                            style={{
                              height: `${heightMultiplier * 56 - 4}px`,
                              zIndex: 10,
                              opacity: (event as FilteredEvent).isOptional ? 0.4 : 1,
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + hourIndex * 0.02 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="flex flex-col h-full overflow-hidden">
                              <span className="text-[10px] font-bold leading-tight text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap max-w-full block">
                                {subject?.name || event.title}
                              </span>
                              <span className="text-[9px] text-gray-700 flex items-center gap-0.5 mt-0.5 font-medium">
                                <Clock className="w-2.5 h-2.5" />
                                {event.start_time.slice(0, 5)}
                              </span>
                              {event.room_number && heightMultiplier >= 1.5 && (
                                <span className="text-[8px] text-gray-600 truncate mt-auto font-medium">
                                  📍 {event.room_number}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
