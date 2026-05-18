import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { CalendarTodayList } from "./CalendarTodayList";
import { ExamDetailModal } from "./ExamDetailModal";
import { ChevronLeft, ChevronRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface CalendarPocketSpaceProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  subjects: Subject[];
  originRect?: DOMRect;
  initialDate?: Date;
}

export const CalendarPocketSpace = ({
  isOpen,
  onClose,
  events,
  subjects,
  originRect,
  initialDate,
}: CalendarPocketSpaceProps) => {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const sounds = useSoundEffects();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [showTopShadow, setShowTopShadow] = useState(true);
  const wasAtTop = useRef(true);
  
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
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Track scroll position for conditional dismiss
  const handleGridScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const atTop = scrollTop <= 2;
    
    setIsScrolledDown(!atTop);
    setShowTopShadow(atTop);
    
    // Haptic feedback when returning to top (dismiss becomes available)
    if (atTop && !wasAtTop.current) {
      haptics.selection();
      wasAtTop.current = true;
    } else if (!atTop) {
      wasAtTop.current = false;
    }
  }, [haptics]);

  // Attach scroll listener to the WeeklyTimeGrid's scroll container
  useEffect(() => {
    if (!isOpen) return;
    
    // Find the scroll container inside WeeklyTimeGrid
    const timer = setTimeout(() => {
      const scrollEl = containerRef.current?.querySelector('.calendar-scroll-container');
      if (scrollEl) {
        scrollContainerRef.current = scrollEl as HTMLDivElement;
        scrollEl.addEventListener('scroll', handleGridScroll, { passive: true });
      }
    }, 300);
    
    return () => {
      clearTimeout(timer);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scroll', handleGridScroll);
      }
    };
  }, [isOpen, handleGridScroll]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    haptics.selection();
    sounds.tap();
    const delta = direction === 'next' ? 7 : -7;
    setCurrentWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + delta);
      return d;
    });
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + delta);
      return d;
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
    setSelectedDate(new Date());
  };

  const goToDate = (date: Date) => {
    haptics.selection();
    sounds.tap();
    const dayOfWeek = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - dayOfWeek + 1);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
    setSelectedDate(date);
    setDatePickerOpen(false);
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

  const handleExamClick = (exam: CalendarEvent) => {
    haptics.soft();
    sounds.open();
    setSelectedExam(exam);
  };

  const handleEventClick = (event: CalendarEvent) => {
    haptics.selection();
    sounds.tap();
    if (event.event_type === 'exam') {
      handleExamClick(event);
    } else {
      navigate(`/course/${event.id}`);
      onClose();
    }
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
            // Conditional drag: only allow dismiss when at top
            drag={isScrolledDown ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (!isScrolledDown && (info.offset.y > 80 || info.velocity.y > 400)) {
                handleClose();
              }
            }}
            style={{ 
              willChange: 'transform',
              touchAction: isScrolledDown ? 'auto' : 'pan-y pinch-zoom',
              overscrollBehaviorY: 'contain',
            }}
          >
            {/* Main Pocket Content */}
            <div className="h-full w-full pocket-space-bg overflow-hidden flex flex-col">
              {/* Swipe Indicator - only visible when at top */}
              <motion.div 
                className="flex justify-center pt-2 pb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: isScrolledDown ? 0.2 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </motion.div>

              {/* Compact Header */}
              <motion.header 
                className="px-4 pb-2"
                variants={headerVariants}
              >
                {/* Row 1: Sparkle icon + Back button (top right) */}
                <div className="flex items-center justify-between mb-1">
                  <motion.button
                    onClick={handleClose}
                    className="flex items-center gap-2 min-w-[44px] min-h-[44px] touch-manipulation"
                    whileTap={{ scale: 0.95 }}
                    aria-label="Retour à Pulse"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-display text-sm font-bold text-foreground">Orbit</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={handleClose}
                    className="p-2 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    whileTap={{ scale: 0.85 }}
                    aria-label={t('common.close')}
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </motion.button>
                </div>

                {/* Row 2: Month/Year + Navigation arrows */}
                <div className="flex items-center justify-between">
                  {/* Month/Year with Date Picker */}
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button 
                        className="text-left active:opacity-70 transition-opacity min-h-[44px] flex items-center touch-manipulation"
                        onClick={() => haptics.selection()}
                      >
                        <h1 className="font-display text-lg font-bold text-foreground capitalize">
                          {monthYear}
                        </h1>
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
                  
                  {/* Navigation Controls - 44x44pt */}
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="rounded-full text-xs font-medium px-2.5 min-h-[44px] min-w-[44px]"
                    >
                      {t('calendar.today')}
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
                  </div>
                </div>
              </motion.header>

              {/* Inner shadow indicator at top of calendar */}
              <motion.div
                className="relative z-10 h-3 pointer-events-none -mb-3"
                animate={{ opacity: showTopShadow ? 1 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <div 
                  className="h-full"
                  style={{
                    background: 'linear-gradient(to bottom, hsl(var(--foreground) / 0.06), transparent)',
                  }}
                />
              </motion.div>

              {/* Main view — liste uniquement */}
              <motion.div
                className="flex-1 overflow-hidden px-2"
                variants={gridVariants}
              >
                <CalendarTodayList
                  currentDate={selectedDate}
                  weekDays={weekDays}
                  events={events}
                  subjects={subjects}
                  onSelectDay={(d) => setSelectedDate(d)}
                  onEventClick={handleEventClick}
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
