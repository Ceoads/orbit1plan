import { GlassCard } from "@/components/GlassCard";
import { SubjectBadge, SubjectDot } from "@/components/SubjectBadge";
import { useOrbitData } from "@/hooks/useOrbitData";
import { Clock, BookOpen, CalendarDays, Sparkles } from "lucide-react";

export const PulsePage = () => {
  const { 
    getCurrentClass, 
    getNextClass, 
    getSubjectById, 
    getHighestPriorityTask,
    getUpcomingExams,
    notes,
    tasks,
  } = useOrbitData();

  const today = new Date();
  const greeting = getGreeting();
  
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

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function getDaysUntil(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const todoCount = tasks.filter(t => t.status === 'todo' && !t.is_subtask).length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pt-2">
        <p className="text-muted-foreground text-sm">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {greeting}! ✨
        </h1>
      </div>

      {/* Current/Next Class */}
      <section>
        <GlassCard className="p-5 overflow-hidden relative">
          {classSubject && (
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl bg-primary`} />
            </div>
          )}
          
          <div className="relative z-10">
            {displayClass && classSubject ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SubjectDot subject={{ 
                      id: classSubject.id, 
                      name: classSubject.name, 
                      colorKey: classSubject.color_key as any,
                      teacher: classSubject.teacher_name || '',
                      icon: classSubject.icon 
                    }} />
                    <span className="text-sm font-medium text-muted-foreground">
                      {isCurrentlyInClass ? 'Currently in' : 'Up next'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{displayClass.start_time.slice(0, 5)} - {displayClass.end_time.slice(0, 5)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{classSubject.icon}</div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">
                      {classSubject.name}
                    </h2>
                    {classSubject.teacher_name && (
                      <p className="text-sm text-muted-foreground">
                        with {classSubject.teacher_name}
                      </p>
                    )}
                  </div>
                </div>
                
                {isCurrentlyInClass && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-medium text-success">Class in progress</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No classes scheduled</p>
                  <p className="font-display font-semibold text-foreground">Enjoy your free time!</p>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </section>

      {/* Priority Task */}
      {priorityTask && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-warning" />
            <h2 className="font-display font-semibold text-foreground">Focus on this</h2>
          </div>
          <GlassCard className="p-5 border-l-4 border-l-primary">
            <h3 className="font-display text-lg font-bold text-foreground mb-2">
              {priorityTask.title}
            </h3>
            <div className="flex items-center gap-3">
              {taskSubject && (
                <div className="flex items-center gap-1.5">
                  <SubjectDot subject={{
                    id: taskSubject.id,
                    name: taskSubject.name,
                    colorKey: taskSubject.color_key as any,
                    teacher: '',
                    icon: taskSubject.icon
                  }} />
                  <span className="text-sm text-muted-foreground">{taskSubject.name}</span>
                </div>
              )}
              {priorityTask.due_date && (
                <span className="text-sm text-muted-foreground">
                  Due {getDaysUntil(priorityTask.due_date) === 0 ? 'today' : 
                       getDaysUntil(priorityTask.due_date) === 1 ? 'tomorrow' :
                       `in ${getDaysUntil(priorityTask.due_date)} days`}
                </span>
              )}
            </div>
          </GlassCard>
        </section>
      )}

      {/* Upcoming Exam Alert */}
      {nextExam && examSubject && nextExam.exam_date && getDaysUntil(nextExam.exam_date) <= 7 && (
        <section>
          <GlassCard variant="elevated" className="p-4 border-l-4 border-l-warning">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Upcoming exam</p>
                <p className="font-display font-semibold text-foreground">
                  {examSubject.icon} {nextExam.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-warning">
                  {getDaysUntil(nextExam.exam_date)}
                </p>
                <p className="text-xs text-muted-foreground">days left</p>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-3">
        <GlassCard variant="subtle" className="p-3 text-center">
          <p className="text-2xl font-display font-bold text-primary">{notes.length}</p>
          <p className="text-xs text-muted-foreground">Notes</p>
        </GlassCard>
        <GlassCard variant="subtle" className="p-3 text-center">
          <p className="text-2xl font-display font-bold text-success">{doneCount}</p>
          <p className="text-xs text-muted-foreground">Tasks done</p>
        </GlassCard>
        <GlassCard variant="subtle" className="p-3 text-center">
          <p className="text-2xl font-display font-bold text-warning">{upcomingExams.length}</p>
          <p className="text-xs text-muted-foreground">Exams</p>
        </GlassCard>
      </section>
    </div>
  );
};
