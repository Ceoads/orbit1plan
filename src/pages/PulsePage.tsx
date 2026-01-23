import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { ClassRecapCard, ClassTimeline } from "@/components/dashboard";
import { useOrbitData } from "@/hooks/useOrbitData";
import { Clock, BookOpen, CalendarDays, Sparkles, MapPin, Bell, ChevronRight } from "lucide-react";

export const PulsePage = () => {
  const { 
    getCurrentClass, 
    getNextClass, 
    getSubjectById, 
    getHighestPriorityTask, 
    getUpcomingExams, 
    getTodayEvents,
    notes, 
    tasks 
  } = useOrbitData();
  
  const [showRoomReminder, setShowRoomReminder] = useState(false);
  const [minutesToClass, setMinutesToClass] = useState<number | null>(null);

  const today = new Date();
  const currentClass = getCurrentClass();
  const nextClass = getNextClass();
  const displayClass = currentClass || nextClass;
  const classSubject = displayClass ? getSubjectById(displayClass.subject_id) : null;
  const isCurrentlyInClass = !!currentClass;
  const priorityTask = getHighestPriorityTask();
  const upcomingExams = getUpcomingExams();
  const nextExam = upcomingExams[0];
  const examSubject = nextExam ? getSubjectById(nextExam.subject_id) : null;
  
  // Get today's events for the timeline
  const todayEvents = getTodayEvents?.() || [];
  
  // Transform events for the timeline component
  const timelineEvents = todayEvents
    .filter(event => {
      // Filter out the current/main display class to avoid duplication
      if (displayClass && event.id === displayClass.id) return false;
      // Only show future events
      const now = new Date();
      const [hours, mins] = event.end_time.split(':').map(Number);
      const eventEnd = new Date();
      eventEnd.setHours(hours, mins, 0, 0);
      return eventEnd > now;
    })
    .slice(0, 4) // Show max 4 upcoming events
    .map(event => {
      const subject = getSubjectById(event.subject_id);
      const now = new Date();
      const [startH, startM] = event.start_time.split(':').map(Number);
      const [endH, endM] = event.end_time.split(':').map(Number);
      const eventStart = new Date();
      eventStart.setHours(startH, startM, 0, 0);
      const eventEnd = new Date();
      eventEnd.setHours(endH, endM, 0, 0);
      
      return {
        id: event.id,
        title: event.title,
        startTime: event.start_time,
        endTime: event.end_time,
        subjectName: subject?.name || event.title,
        colorKey: subject?.color_key,
        eventType: event.event_type,
        isCurrentEvent: now >= eventStart && now <= eventEnd,
      };
    });

  useEffect(() => {
    const checkClassTime = () => {
      if (!nextClass || isCurrentlyInClass) { 
        setShowRoomReminder(false); 
        return; 
      }
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
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Mesh Background Decorations */}
      <div className="fixed inset-0 pointer-events-none -z-10 mesh-background opacity-70" />
      
      {/* Header */}
      <div className="pt-4">
        <p className="text-muted-foreground text-sm font-medium">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-display text-3xl font-bold text-foreground mt-1">
          {getGreeting()}! ✨
        </h1>
      </div>

      {/* Room Reminder Alert */}
      {showRoomReminder && nextClass?.room_number && (
        <div className="soft-card p-4 border-l-4 border-l-primary animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Class in {minutesToClass} min</p>
              <p className="font-display font-bold text-foreground text-lg">📍 {nextClass.room_number}</p>
            </div>
            <Bell className="w-5 h-5 text-primary animate-bounce" />
          </div>
        </div>
      )}

      {/* Main Class Card */}
      {displayClass && classSubject ? (
        <ClassRecapCard
          subjectName={classSubject.name}
          subjectIcon={classSubject.icon}
          startTime={displayClass.start_time.slice(0, 5)}
          endTime={displayClass.end_time.slice(0, 5)}
          teacherName={displayClass.teacher_name || classSubject.teacher_name}
          roomNumber={displayClass.room_number}
          isCurrentClass={isCurrentlyInClass}
        />
      ) : (
        <div className="soft-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">No classes scheduled</p>
              <p className="font-display font-semibold text-lg">Enjoy your free time! 🎉</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      {timelineEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Today's Schedule
            </h2>
            <span className="text-sm text-muted-foreground">
              {timelineEvents.length} more
            </span>
          </div>
          <div className="soft-card p-5">
            <ClassTimeline events={timelineEvents} />
          </div>
        </section>
      )}

      {/* Focus Task */}
      {priorityTask && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-warning" />
            <h2 className="font-display font-semibold text-foreground">Focus on this</h2>
          </div>
          <div className="soft-card p-5 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground">{priorityTask.title}</h3>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Exam Alert */}
      {nextExam && examSubject && nextExam.exam_date && getDaysUntil(nextExam.exam_date) <= 7 && (
        <div className="soft-card p-5 border-l-4 border-l-warning">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Upcoming exam</p>
              <p className="font-display font-semibold text-foreground">
                {examSubject.icon} {nextExam.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-warning">{getDaysUntil(nextExam.exam_date)}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-3 gap-3">
        <div className="soft-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{notes.length}</p>
          <p className="text-xs text-muted-foreground font-medium mt-1">Notes</p>
        </div>
        <div className="soft-card p-4 text-center">
          <p className="text-2xl font-bold text-success">{doneCount}</p>
          <p className="text-xs text-muted-foreground font-medium mt-1">Done</p>
        </div>
        <div className="soft-card p-4 text-center">
          <p className="text-2xl font-bold text-warning">{upcomingExams.length}</p>
          <p className="text-xs text-muted-foreground font-medium mt-1">Exams</p>
        </div>
      </section>
    </div>
  );
};