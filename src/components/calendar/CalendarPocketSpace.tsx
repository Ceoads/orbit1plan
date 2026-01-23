import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { WeeklyTimeGrid } from "./WeeklyTimeGrid";
import { ExamDetailModal } from "./ExamDetailModal";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";

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
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  });
  
  const [selectedExam, setSelectedExam] = useState<CalendarEvent | null>(null);

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

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeekStart]);

  const monthYear = currentWeekStart.toLocaleDateString('en-US', { 
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
            className="fixed inset-0 z-50 overflow-hidden pt-safe"
            variants={pocketVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                handleClose();
              }
            }}
            style={{ willChange: 'transform' }}
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
                    <div>
                      <h1 className="font-display text-xl font-bold text-foreground">
                        {monthYear}
                      </h1>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="rounded-full text-xs font-medium px-3 h-9 hit-target"
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateWeek('prev')}
                      className="rounded-full h-9 w-9 hit-target"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateWeek('next')}
                      className="rounded-full h-9 w-9 hit-target"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="rounded-full h-9 w-9 hit-target ml-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.header>

              {/* Weekly Time Grid */}
              <motion.div 
                className="flex-1 overflow-hidden px-2"
                variants={gridVariants}
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
