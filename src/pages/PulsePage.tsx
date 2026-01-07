import { CurrentClassCard } from "@/components/CurrentClassCard";
import { PriorityTaskCard } from "@/components/PriorityTaskCard";
import { GlassCard } from "@/components/GlassCard";
import { mockExams, getSubjectById, getDaysUntil } from "@/lib/mockData";
import { CalendarDays, Sparkles } from "lucide-react";

export const PulsePage = () => {
  const today = new Date();
  const greeting = getGreeting();
  
  // Get next upcoming exam
  const upcomingExam = mockExams
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const examSubject = upcomingExam ? getSubjectById(upcomingExam.subjectId) : null;
  const daysUntilExam = upcomingExam ? getDaysUntil(upcomingExam.date) : null;

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

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
        <CurrentClassCard />
      </section>

      {/* Priority Task */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-warning" />
          <h2 className="font-display font-semibold text-foreground">Focus on this</h2>
        </div>
        <PriorityTaskCard />
      </section>

      {/* Upcoming Exam Alert */}
      {upcomingExam && examSubject && daysUntilExam !== null && daysUntilExam <= 7 && (
        <section>
          <GlassCard 
            variant="elevated" 
            className="p-4 border-l-4 border-l-warning"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Upcoming exam</p>
                <p className="font-display font-semibold text-foreground">
                  {examSubject.icon} {upcomingExam.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-warning">{daysUntilExam}</p>
                <p className="text-xs text-muted-foreground">days left</p>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-3">
        <GlassCard variant="subtle" className="p-3 text-center">
          <p className="text-2xl font-display font-bold text-primary">12</p>
          <p className="text-xs text-muted-foreground">Notes</p>
        </GlassCard>
        <GlassCard variant="subtle" className="p-3 text-center">
          <p className="text-2xl font-display font-bold text-success">4</p>
          <p className="text-xs text-muted-foreground">Tasks done</p>
        </GlassCard>
        <GlassCard variant="subtle" className="p-3 text-center">
          <p className="text-2xl font-display font-bold text-warning">3</p>
          <p className="text-xs text-muted-foreground">Exams</p>
        </GlassCard>
      </section>
    </div>
  );
};
