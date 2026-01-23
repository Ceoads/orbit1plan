import { motion, AnimatePresence } from "framer-motion";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { Calendar, Clock, MapPin, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExamDetailModalProps {
  exam: CalendarEvent | null;
  subject?: Subject;
  onClose: () => void;
}

export const ExamDetailModal = ({
  exam,
  subject,
  onClose,
}: ExamDetailModalProps) => {
  if (!exam) return null;

  const getDaysUntil = (): number => {
    if (!exam.exam_date) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const examDate = new Date(exam.exam_date);
    examDate.setHours(0, 0, 0, 0);
    return Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysUntil = getDaysUntil();

  const getDuration = (): string => {
    const [startH, startM] = exam.start_time.split(':').map(Number);
    const [endH, endM] = exam.end_time.split(':').map(Number);
    const minutes = (endH * 60 + endM) - (startH * 60 + startM);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const getUrgencyColor = () => {
    if (daysUntil <= 1) return 'from-destructive to-destructive/80';
    if (daysUntil <= 3) return 'from-warning to-warning/80';
    return 'from-primary to-accent';
  };

  return (
    <AnimatePresence>
      {exam && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-1/2 z-[70] max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9, y: '-40%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-40%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              {/* Gradient Header */}
              <div className={`bg-gradient-to-r ${getUrgencyColor()} p-6 text-white`}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                    {subject?.icon || '📝'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white/80 text-sm font-medium">Upcoming Exam</p>
                    <h2 className="font-display text-xl font-bold mt-0.5">
                      {subject?.name || exam.title}
                    </h2>
                    {exam.title !== subject?.name && (
                      <p className="text-white/90 text-sm mt-1">{exam.title}</p>
                    )}
                  </div>
                </div>

                {/* Countdown */}
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-5xl font-bold leading-none">{daysUntil}</span>
                  <span className="text-white/80 text-lg pb-1">
                    {daysUntil === 1 ? 'day left' : 'days left'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="bg-card p-5 space-y-4">
                {/* Date */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground">
                      {exam.exam_date 
                        ? new Date(exam.exam_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time & Duration</p>
                    <p className="font-medium text-foreground">
                      {exam.start_time.slice(0, 5)} - {exam.end_time.slice(0, 5)}
                      <span className="text-muted-foreground ml-2">({getDuration()})</span>
                    </p>
                  </div>
                </div>

                {/* Room */}
                {exam.room_number && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium text-foreground">{exam.room_number}</p>
                    </div>
                  </div>
                )}

                {/* Study Action */}
                <Button 
                  className="w-full mt-4 h-12 rounded-2xl gradient-primary text-white font-semibold"
                  onClick={onClose}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Studying
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
