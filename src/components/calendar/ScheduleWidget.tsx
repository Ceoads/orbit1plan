import { useState, useRef } from "react";
import { toLocalDateStr } from "@/lib/dateFormat";
import { motion } from "framer-motion";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { CalendarPocketSpace } from "./CalendarPocketSpace";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useTranslation } from "react-i18next";

interface ScheduleWidgetProps {
  events: CalendarEvent[];
  subjects: Subject[];
  className?: string;
}

export const ScheduleWidget = ({
  events,
  subjects,
  className,
}: ScheduleWidgetProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLButtonElement>(null);
  const [originRect, setOriginRect] = useState<DOMRect | undefined>();
  const haptics = useHaptics();
  const sounds = useSoundEffects();

  const handleOpen = () => {
    haptics.soft();
    sounds.open();
    if (widgetRef.current) {
      setOriginRect(widgetRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    haptics.soft();
    sounds.close();
    setIsOpen(false);
  };

  // Get today's events summary
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const todayEvents = events.filter(e => {
    if (e.event_date) return e.event_date === todayStr;
    return e.day_of_week === today.getDay();
  });
  const upcomingExams = events.filter(e => {
    if (e.event_type !== 'exam' || !e.exam_date) return false;
    const examDate = new Date(e.exam_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return examDate >= now;
  });

  // Get next 3 events for preview
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcomingTodayEvents = todayEvents
    .filter(e => {
      const [h, m] = e.start_time.split(':').map(Number);
      return h * 60 + m >= nowMinutes;
    })
    .sort((a, b) => {
      const [aH, aM] = a.start_time.split(':').map(Number);
      const [bH, bM] = b.start_time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    })
    .slice(0, 3);

  const getSubject = (subjectId: string | null) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getSubjectBgClass = (colorKey: string) => {
    const colorMap: Record<string, string> = {
      math: 'bg-subject-math/20',
      history: 'bg-subject-history/20',
      physics: 'bg-subject-physics/20',
      english: 'bg-subject-english/20',
      chemistry: 'bg-subject-chemistry/20',
    };
    return colorMap[colorKey] || 'bg-muted';
  };

  return (
    <>
      <motion.button
        ref={widgetRef}
        onClick={handleOpen}
        className={cn(
          "w-full soft-card p-5 text-left group cursor-pointer hit-target",
          "hover:shadow-lg transition-shadow duration-300",
          className
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        layoutId="schedule-widget"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">
                {t('pulse.todaySchedule')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {todayEvents.length} {t('calendar.noClasses').toLowerCase().includes('cours') ? 'cours' : 'classes'} • {upcomingExams.length} {t('exams.upcoming').toLowerCase()}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Preview Events */}
        {upcomingTodayEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingTodayEvents.map((event, index) => {
              const subject = getSubject(event.subject_id);
              const colorKey = subject?.color_key || 'history';
              
              return (
                <motion.div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-xl",
                    getSubjectBgClass(colorKey)
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-lg">{subject?.icon || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {subject?.name || event.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {event.start_time.slice(0, 5)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            {t('calendar.noClasses')} 🎉
          </div>
        )}

        {/* Tap Hint */}
        <p className="text-[10px] text-muted-foreground text-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {t('calendar.tapToViewFull', 'Voir le calendrier complet')}
        </p>
      </motion.button>

      {/* Pocket Space */}
      <CalendarPocketSpace
        isOpen={isOpen}
        onClose={handleClose}
        events={events}
        subjects={subjects}
        originRect={originRect}
      />
    </>
  );
};
