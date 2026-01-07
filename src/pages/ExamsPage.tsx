import { mockExams, getDaysUntil } from "@/lib/mockData";
import { ExamCard } from "@/components/ExamCard";
import { GraduationCap } from "lucide-react";

export const ExamsPage = () => {
  const sortedExams = [...mockExams].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const upcomingExams = sortedExams.filter(e => getDaysUntil(e.date) >= 0);
  const pastExams = sortedExams.filter(e => getDaysUntil(e.date) < 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h1 className="font-display text-xl font-bold text-foreground">
          Exam Lab
        </h1>
      </div>

      {/* Upcoming Exams */}
      <section>
        <h2 className="font-display font-semibold text-foreground mb-3">
          Coming Up
        </h2>
        <div className="space-y-4">
          {upcomingExams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No upcoming exams 🎉</p>
            </div>
          ) : (
            upcomingExams.map(exam => (
              <ExamCard key={exam.id} exam={exam} />
            ))
          )}
        </div>
      </section>

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-muted-foreground mb-3">
            Past Exams
          </h2>
          <div className="space-y-4 opacity-60">
            {pastExams.map(exam => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
