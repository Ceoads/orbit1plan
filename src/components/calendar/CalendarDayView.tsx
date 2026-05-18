import { useState, useMemo } from "react";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { FilteredEvent } from "@/lib/eventFilter";
import { GlassCard } from "@/components/GlassCard";
import { SwipeableItem } from "@/components/SwipeableItem";
import { Clock, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AddClassModal, EditClassModal } from "@/components/modals";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useTranslation } from "react-i18next";

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  subjects: Subject[];
  onBack: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateChange?: (date: Date) => void;
}

export const CalendarDayView = ({
  date,
  events,
  subjects,
  onBack,
  onEventClick,
  onDateChange,
}: CalendarDayViewProps) => {
  const { deleteEvent } = useOrbitData();
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState(0);
  const [showAddClass, setShowAddClass] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  
  // Get the week days centered around the current date's month
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [date]);

  const dateStr = toLocalDateStr(date);
  
  const dayEvents = events
    .filter(e => {
      if (e.event_date) return e.event_date === dateStr;
      return e.day_of_week === date.getDay();
    })
    .sort((a, b) => {
      const [aH, aM] = a.start_time.split(':').map(Number);
      const [bH, bM] = b.start_time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });

  const getEventsForDay = (d: Date) => {
    const dStr = toLocalDateStr(d);
    return events.filter(e => {
      if (e.event_date) return e.event_date === dStr;
      return e.day_of_week === d.getDay();
    });
  };

  const getFirstEventForDay = (d: Date): CalendarEvent | undefined => {
    const dayEvts = getEventsForDay(d).filter(e => e.event_type === 'class');
    if (dayEvts.length === 0) return undefined;
    return dayEvts.sort((a, b) => {
      const [aH, aM] = a.start_time.split(':').map(Number);
      const [bH, bM] = b.start_time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    })[0];
  };

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

  const navigateDay = (offset: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + offset);
    setDirection(offset);
    onDateChange?.(newDate);
  };

  const selectDay = (newDate: Date) => {
    const diff = newDate.getTime() - date.getTime();
    setDirection(diff > 0 ? 1 : -1);
    onDateChange?.(newDate);
  };

  const navigateWeek = (offset: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setDirection(offset);
    onDateChange?.(newDate);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      navigateDay(-1);
    } else if (info.offset.x < -threshold) {
      navigateDay(1);
    }
  };

  const handleEmptySlotClick = (hour: number) => {
    setSelectedHour(hour);
    setShowAddClass(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteEvent(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isSelected = (d: Date) => {
    return d.toDateString() === date.toDateString();
  };

  // Generate time slots from 08:00 to 20:00
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const dayNames = i18n.language === 'fr' 
    ? ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
        <div className="flex-1">
          <h2 className="font-display font-semibold text-foreground text-lg">
            {date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
      </div>

      {/* Week Strip with Hover Preview */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigateWeek(-1)}
          className="rounded-full h-8 w-8 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 flex justify-between">
          {weekDays.map((day, index) => {
            const dayEvts = getEventsForDay(day);
            const hasEvents = dayEvts.length > 0;
            const selected = isSelected(day);
            const today = isToday(day);
            const firstEvent = getFirstEventForDay(day);
            const firstSubject = firstEvent ? getSubject(firstEvent.subject_id) : null;
            
            return (
              <HoverCard key={day.toISOString()} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => selectDay(day)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[40px]",
                      selected && "bg-primary text-primary-foreground shadow-md",
                      !selected && today && "ring-2 ring-primary ring-inset",
                      !selected && !today && "hover:bg-accent"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-medium",
                      selected ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {dayNames[index]}
                    </span>
                    <span className={cn(
                      "text-sm font-semibold",
                      selected ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {day.getDate()}
                    </span>
                    {/* Event indicator dot */}
                    {hasEvents && (
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        selected ? "bg-primary-foreground" : "bg-warning"
                      )} />
                    )}
                  </button>
                </HoverCardTrigger>
                {hasEvents && firstEvent && (
                  <HoverCardContent className="w-56 p-3" side="bottom">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {day.toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                      <div className="flex items-center gap-2">
                        {firstSubject && (
                          <span className="text-lg">{firstSubject.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {firstSubject?.name || firstEvent.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {firstEvent.start_time.slice(0, 5)} - {firstEvent.end_time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      {dayEvts.length > 1 && (
                        <p className="text-xs text-muted-foreground">
                          +{dayEvts.length - 1} more class{dayEvts.length > 2 ? 'es' : ''}
                        </p>
                      )}
                    </div>
                  </HoverCardContent>
                )}
              </HoverCard>
            );
          })}
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigateWeek(1)}
          className="rounded-full h-8 w-8 flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected day label */}
      <p className="text-sm text-muted-foreground text-center">
        {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {/* Swipeable Timeline View */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={date.toISOString()}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative space-y-0 overflow-y-auto max-h-[calc(100vh-420px)] touch-pan-y"
        >
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
                          <SwipeableItem
                            key={event.id}
                            onEdit={() => setEditingEvent(event)}
                            onDelete={() => setDeleteTarget({ id: event.id, name: event.title })}
                          >
                            <button
                              onClick={() => onEventClick?.(event)}
                              className={cn(
                                "w-full text-left rounded-xl p-3 border-l-4 transition-all hover:scale-[1.01]",
                                getSubjectBorderColor(colorKey),
                                getSubjectBgColor(colorKey),
                                (event as FilteredEvent).isOptional && "opacity-40"
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
                          </SwipeableItem>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEmptySlotClick(hour)}
                      className="w-full h-[48px] border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all group"
                    >
                      <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Add class</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* No Events Message */}
          {dayEvents.length === 0 && (
            <GlassCard variant="subtle" className="p-6 text-center mt-4">
              <p className="text-muted-foreground">No classes scheduled for this day</p>
              <p className="text-xs text-muted-foreground mt-1">Tap an empty slot to add a class</p>
            </GlassCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AddClassModal
        open={showAddClass}
        onOpenChange={setShowAddClass}
        defaultHour={selectedHour}
        defaultDayOfWeek={date.getDay()}
        subjects={subjects}
      />
      <EditClassModal
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        event={editingEvent}
        subjects={subjects}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
