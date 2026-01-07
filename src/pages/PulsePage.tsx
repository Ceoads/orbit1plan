import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { SubjectDot } from "@/components/SubjectBadge";
import { useOrbitData } from "@/hooks/useOrbitData";
import { Clock, BookOpen, CalendarDays, Sparkles, MapPin, Bell } from "lucide-react";

export const PulsePage = () => {
  const { getCurrentClass, getNextClass, getSubjectById, getHighestPriorityTask, getUpcomingExams, notes, tasks } = useOrbitData();
  const [showRoomReminder, setShowRoomReminder] = useState(false);
  const [minutesToClass, setMinutesToClass] = useState<number | null>(null);

  const today = new Date();
  const currentClass = getCurrentClass();
  const nextClass = getNextClass();
  const displayClass = currentClass || nextClass;
  const classSubject = displayClass ? getSubjectById(displayClass.subject_id) : null;
  const isCurrentlyInClass = !!currentClass;
  const priorityTask = getHighestPriorityTask();
  const taskSubject = priorityTask?.subject_id ? getSubjectById(priorityTask.subject_id) : null;
  const upcomingExams = getUpcomingExams();
  const nextExam = upcomingExams[0];
  const examSubject = nextExam ? getSubjectById(nextExam.subject_id) : null;

  useEffect(() => {
    const checkClassTime = () => {
      if (!nextClass || isCurrentlyInClass) { setShowRoomReminder(false); return; }
      const now = new Date();
      const [startHour, startMin] = nextClass.start_time.split(':').map(Number);
      const classStart = new Date();
      classStart.setHours(startHour, startMin, 0, 0);
      const diff = classStart.getTime() - now.getTime();
      const minutesUntil = Math.floor(diff / 60000);
      if (minutesUntil > 0 && minutesUntil <= 10 && nextClass.room_number) {
        setShowRoomReminder(true);
        setMinutesToClass(minutesUntil);
      } else {
        setShowRoomReminder(false);
        setMinutesToClass(null);
      }
    };
    checkClassTime();
    const interval = setInterval(checkClassTime, 30000);
    return () => clearInterval(interval);
  }, [nextClass, isCurrentlyInClass]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getDaysUntil = (dateStr: string): number => {
    return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const todoCount = tasks.filter(t => t.status === 'todo' && !t.is_subtask).length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pt-2">
        <p className="text-muted-foreground text-sm">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="font-display text-2xl font-bold text-foreground">{getGreeting()}! ✨</h1>
      </div>

      {showRoomReminder && nextClass?.room_number && (
        <GlassCard variant="elevated" className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-primary" /></div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Class in {minutesToClass} min</p>
              <p className="font-display font-bold text-foreground text-lg">📍 {nextClass.room_number}</p>
            </div>
            <Bell className="w-5 h-5 text-primary animate-bounce" />
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-5">
        {displayClass && classSubject ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{isCurrentlyInClass ? 'Currently in' : 'Up next'}</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4" />{displayClass.start_time.slice(0,5)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{classSubject.icon}</span>
              <div>
                <h2 className="font-display text-xl font-bold">{classSubject.name}</h2>
                {displayClass.room_number && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{displayClass.room_number}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
            <p className="text-muted-foreground">No classes scheduled</p>
          </div>
        )}
      </GlassCard>

      {priorityTask && (
        <section>
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-warning" /><h2 className="font-display font-semibold">Focus on this</h2></div>
          <GlassCard className="p-5 border-l-4 border-l-primary">
            <h3 className="font-display font-bold">{priorityTask.title}</h3>
          </GlassCard>
        </section>
      )}

      {nextExam && examSubject && nextExam.exam_date && getDaysUntil(nextExam.exam_date) <= 7 && (
        <GlassCard variant="elevated" className="p-4 border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-warning" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Upcoming exam</p>
              <p className="font-display font-semibold">{examSubject.icon} {nextExam.title}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-warning">{getDaysUntil(nextExam.exam_date)}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
          </div>
        </GlassCard>
      )}

      <section className="grid grid-cols-3 gap-3">
        <GlassCard variant="subtle" className="p-3 text-center"><p className="text-2xl font-bold text-primary">{notes.length}</p><p className="text-xs text-muted-foreground">Notes</p></GlassCard>
        <GlassCard variant="subtle" className="p-3 text-center"><p className="text-2xl font-bold text-success">{doneCount}</p><p className="text-xs text-muted-foreground">Done</p></GlassCard>
        <GlassCard variant="subtle" className="p-3 text-center"><p className="text-2xl font-bold text-warning">{upcomingExams.length}</p><p className="text-xs text-muted-foreground">Exams</p></GlassCard>
      </section>
    </div>
  );
};
