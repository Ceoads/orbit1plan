import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { WeeklyTimeGrid } from "./WeeklyTimeGrid";
import { ExamDetailModal } from "./ExamDetailModal";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { cn } from "@/lib/utils";

interface CalendarPocketSpaceProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  subjects: Subject[];
  originRect?: DOMRect;
}

export const CalendarPocketSpace = ({
  isOpen,
  onClose,
  events,
  subjects,
  originRect,
}: CalendarPocketSpaceProps) => {
  const haptics = useHaptics();
  const sounds = useSoundEffects();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSwipeDirection = useRef<'left' | 'right' | null>(null);
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  });
  
  const [selectedExam, setSelectedExam] = useState<CalendarEvent | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const navigateWeek = (direction: 'prev' | 'next') => {
    haptics.selection();
    sounds.tap();
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const goToToday = () => {
    haptics.selection();
    sounds.tap();
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek + 1);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  const goToDate = (date: Date) => {
    haptics.selection();
    sounds.tap();
    const dayOfWeek = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - dayOfWeek + 1);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
    setDatePickerOpen(false);
  };

  // Handle horizontal swipe for week navigation
  const handleHorizontalSwipe = (info: PanInfo) => {
    const threshold = 80;
    const velocity = Math.abs(info.velocity.x);
    const offset = info.offset.x;
    
    // Only trigger if horizontal movement is significant
    if (Math.abs(offset) > threshold || velocity > 400) {
      if (offset > 0) {
        // Swipe right -> previous week
        if (lastSwipeDirection.current !== 'right') {
          lastSwipeDirection.current = 'right';
          navigateWeek('prev');
        }
      } else {
        // Swipe left -> next week
        if (lastSwipeDirection.current !== 'left') {
          lastSwipeDirection.current = 'left';
          navigateWeek('next');
        }
      }
    }
  };

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeekStart]);

  const monthYear = currentWeekStart.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const getExamsOnDate = (date: Date): CalendarEvent[] => {
    return events.filter(e => {
      if (e.event_type !== 'exam' || !e.exam_date) return false;
      const examDate = new Date(e.exam_date);
      return examDate.toDateString() === date.toDateString();
    });
  };

  const handleExamClick = (exam: CalendarEvent) => {
    haptics.soft();
    sounds.open();
    setSelectedExam(exam);
  };

  const handleClose = () => {
    haptics.soft();
    sounds.close();
    onClose();
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const pocketVariants = {
    hidden: {
      scale: 0.85,
      opacity: 0,
      y: 80,
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 22,
        staggerChildren: 0.04,
        delayChildren: 0.08,
      },
    },
    exit: {
      scale: 0.92,
      opacity: 0,
      y: 40,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
    },
  };

  const gridVariants = {
    hidden: { opacity: 0, scale: 0.97 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 0.12, duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* iOS-style Backdrop with heavy blur */}
          <motion.div
            className="fixed inset-0 z-40 ios-glass"
            style={{ background: 'hsl(var(--background) / 0.6)' }}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
          />

          {/* Pocket Space Container */}
          <motion.div
            ref={containerRef}
            className="fixed inset-0 z-50 overflow-hidden pt-safe calendar-pocket-space"
            data-calendar-container
            data-swipe-blocked
            variants={pocketVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              // Handle vertical swipe to close
              if (info.offset.y > 80 || info.velocity.y > 400) {
                handleClose();
              }
              // Reset swipe direction tracker
              lastSwipeDirection.current = null;
            }}
            style={{ 
              willChange: 'transform',
              touchAction: 'pan-y pinch-zoom',
            }}
          >
            {/* Main Pocket Content */}
            <div className="h-full w-full pocket-space-bg overflow-hidden flex flex-col">
              {/* Swipe Indicator */}
              <motion.div 
                className="flex justify-center pt-3 pb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </motion.div>

              {/* Header */}
              <motion.header 
                className="px-4 pb-4"
                variants={headerVariants}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Calendar className="w-5 h-5 text-primary" />
                    </motion.div>
                    
                    {/* Month/Year with Date Picker */}
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <button 
                          className="text-left active:opacity-70 transition-opacity"
                          onClick={() => {
                            haptics.selection();
                          }}
                        >
                          <h1 className="font-display text-xl font-bold text-foreground capitalize">
                            {monthYear}
                          </h1>
                          <p className="text-xs text-muted-foreground">
                            Tap to jump to date
                          </p>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-auto p-0 z-[60]" 
                        align="start"
                        sideOffset={8}
                      >
                        <CalendarPicker
                          mode="single"
                          selected={currentWeekStart}
                          onSelect={(date) => date && goToDate(date)}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Navigation Controls - 44x44pt minimum */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="rounded-full text-xs font-medium px-3 min-h-[44px] min-w-[44px]"
                    >
                      Aujourd'hui
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateWeek('prev')}
                      className="rounded-full min-h-[44px] min-w-[44px] touch-manipulation"
                      aria-label="Semaine précédente"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateWeek('next')}
                      className="rounded-full min-h-[44px] min-w-[44px] touch-manipulation"
                      aria-label="Semaine suivante"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="rounded-full min-h-[44px] min-w-[44px] ml-1 touch-manipulation"
                      aria-label="Fermer"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.header>

              {/* Weekly Time Grid with Horizontal Swipe */}
              <motion.div 
                className="flex-1 overflow-hidden px-2 weekly-time-grid"
                variants={gridVariants}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => handleHorizontalSwipe(info)}
              >
                <WeeklyTimeGrid
                  weekDays={weekDays}
                  events={events}
                  subjects={subjects}
                  getExamsOnDate={getExamsOnDate}
                  onExamClick={handleExamClick}
                />
              </motion.div>

              {/* Bottom padding for floating dock */}
              <div className="mb-safe-dock" />
            </div>
          </motion.div>

          {/* Exam Detail Modal */}
          <ExamDetailModal
            exam={selectedExam}
            subject={selectedExam ? subjects.find(s => s.id === selectedExam.subject_id) : undefined}
            onClose={() => {
              haptics.soft();
              sounds.close();
              setSelectedExam(null);
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};
