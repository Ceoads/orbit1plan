import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { WeeklyTimeGrid } from "./WeeklyTimeGrid";
import { ExamDetailModal } from "./ExamDetailModal";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek + 1); // Start from Monday
    start.setHours(0, 0, 0, 0);
    return start;
  });
  
  const [selectedExam, setSelectedExam] = useState<CalendarEvent | null>(null);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const goToToday = () => {
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

  // Check if an exam exists on a specific date
  const getExamsOnDate = (date: Date): CalendarEvent[] => {
    return events.filter(e => {
      if (e.event_type !== 'exam' || !e.exam_date) return false;
      const examDate = new Date(e.exam_date);
      return examDate.toDateString() === date.toDateString();
    });
  };

  const handleExamClick = (exam: CalendarEvent) => {
    setSelectedExam(exam);
  };

  // Animation variants for the pocket space
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const pocketVariants = {
    hidden: {
      scale: 0.8,
      opacity: 0,
      y: 100,
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
    exit: {
      scale: 0.9,
      opacity: 0,
      y: 50,
      transition: {
        duration: 0.2,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  const gridVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 0.15 }
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Pocket Space Container */}
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            variants={pocketVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
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
                transition={{ delay: 0.3 }}
              >
                <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
              </motion.div>

              {/* Header */}
              <motion.header 
                className="px-4 pb-4"
                variants={headerVariants}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h1 className="font-display text-xl font-bold text-foreground">
                        {monthYear}
                      </h1>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="rounded-full text-xs font-medium px-3 h-8"
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateWeek('prev')}
                      className="rounded-full h-8 w-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateWeek('next')}
                      className="rounded-full h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
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
              <div className="h-24" />
            </div>
          </motion.div>

          {/* Exam Detail Modal */}
          <ExamDetailModal
            exam={selectedExam}
            subject={selectedExam ? subjects.find(s => s.id === selectedExam.subject_id) : undefined}
            onClose={() => setSelectedExam(null)}
          />
        </>
      )}
    </AnimatePresence>
  );
};
