import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface WeeklyTimeGridProps {
  weekDays: Date[];
  events: CalendarEvent[];
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
  const haptics = useHaptics();
  const sounds = useSoundEffects();

  const timeSlots = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm
  }, []);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get all events for a specific day (not filtered by hour)
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dayOfWeek = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    if (eventDate < today) return [];
    
    return events.filter(e => e.day_of_week === dayOfWeek);
  };

  const getSubject = (subjectId: string | null) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getEventDuration = (event: CalendarEvent): number => {
    const [startH, startM] = event.start_time.split(':').map(Number);
    const [endH, endM] = event.end_time.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  const getEventStartMinutes = (event: CalendarEvent): number => {
    const [h, m] = event.start_time.split(':').map(Number);
    return h * 60 + m;
  };

  const getEventEndMinutes = (event: CalendarEvent): number => {
    const [h, m] = event.end_time.split(':').map(Number);
    return h * 60 + m;
  };

  // Check if two events overlap
  const eventsOverlap = (a: CalendarEvent, b: CalendarEvent): boolean => {
    const aStart = getEventStartMinutes(a);
    const aEnd = getEventEndMinutes(a);
    const bStart = getEventStartMinutes(b);
    const bEnd = getEventEndMinutes(b);
    return aStart < bEnd && bStart < aEnd;
  };

  // Assign virtual columns to overlapping events
  const assignEventColumns = (dayEvents: CalendarEvent[]): Map<string, { column: number; totalColumns: number }> => {
    const result = new Map<string, { column: number; totalColumns: number }>();
    
    if (dayEvents.length === 0) return result;
    
    // Sort by start time, then by duration (longer first)
    const sorted = [...dayEvents].sort((a, b) => {
      const startDiff = getEventStartMinutes(a) - getEventStartMinutes(b);
      if (startDiff !== 0) return startDiff;
      return getEventDuration(b) - getEventDuration(a);
    });

    // Track columns: each column tracks the end time of the last event in it
    const columns: number[] = [];

    for (const event of sorted) {
      const eventStart = getEventStartMinutes(event);
      
      // Find the first column where this event can fit
      let assignedColumn = -1;
      for (let col = 0; col < columns.length; col++) {
        if (columns[col] <= eventStart) {
          assignedColumn = col;
          break;
        }
      }

      // If no column fits, create a new one
      if (assignedColumn === -1) {
        assignedColumn = columns.length;
        columns.push(0);
      }

      // Update the column's end time
      columns[assignedColumn] = getEventEndMinutes(event);
      
      result.set(event.id, { column: assignedColumn, totalColumns: 1 }); // totalColumns updated later
    }

    // Now calculate totalColumns for each event based on overlapping events
    for (const event of sorted) {
      const overlappingEvents = sorted.filter(e => e.id !== event.id && eventsOverlap(event, e));
      const columnsUsed = new Set<number>();
      columnsUsed.add(result.get(event.id)!.column);
      
      for (const overlap of overlappingEvents) {
        columnsUsed.add(result.get(overlap.id)!.column);
      }
      
      const maxColumn = Math.max(...Array.from(columnsUsed)) + 1;
      result.set(event.id, { ...result.get(event.id)!, totalColumns: maxColumn });
    }

    return result;
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

  return (
    <div className="h-full flex flex-col">
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
                  "w-8 h-8 rounded-full flex items-center justify-center mt-1 transition-all hit-target",
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
                    className="mt-1.5 hit-target flex items-center justify-center"
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

      {/* Scrollable Time Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
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
                  const allDayEvents = getEventsForDay(day);
                  const columnMap = assignEventColumns(allDayEvents);
                  
                  // Only render events that start at this hour
                  const eventsStartingThisHour = allDayEvents.filter(e => {
                    const [startHour] = e.start_time.split(':').map(Number);
                    return startHour === hour;
                  });
                  
                  return (
                    <div key={day.toISOString()} className="relative min-h-full">
                      {eventsStartingThisHour.map((event) => {
                        const subject = getSubject(event.subject_id);
                        const colorKey = subject?.color_key || 'history';
                        const colors = getSubjectColors(colorKey);
                        const duration = getEventDuration(event);
                        const heightMultiplier = duration / 60;
                        
                        const columnInfo = columnMap.get(event.id) || { column: 0, totalColumns: 1 };
                        const widthPercent = 100 / columnInfo.totalColumns;
                        const leftPercent = columnInfo.column * widthPercent;
                        
                        return (
                          <motion.div
                            key={event.id}
                            className={cn(
                              "absolute rounded-[12px] p-1 border-l-2 overflow-hidden cursor-pointer",
                              "active:scale-95 transition-transform shadow-sm",
                              colors.bg,
                              colors.border
                            )}
                            style={{
                              height: `${heightMultiplier * 56 - 4}px`,
                              width: `calc(${widthPercent}% - 2px)`,
                              left: `calc(${leftPercent}% + 1px)`,
                              zIndex: 10 + columnInfo.column,
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + hourIndex * 0.02 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="flex flex-col h-full overflow-hidden">
                              <span className="text-[9px] font-bold leading-tight line-clamp-2 text-gray-900 truncate">
                                {subject?.name || event.title}
                              </span>
                              <span className="text-[8px] text-gray-700 flex items-center gap-0.5 mt-0.5 font-medium">
                                <Clock className="w-2 h-2 flex-shrink-0" />
                                <span className="truncate">{event.start_time.slice(0, 5)}</span>
                              </span>
                              {event.room_number && heightMultiplier >= 1.5 && columnInfo.totalColumns === 1 && (
                                <span className="text-[7px] text-gray-600 truncate mt-auto font-medium">
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
