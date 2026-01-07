import { useOrbitData } from "@/hooks/useOrbitData";
import { ExamCard } from "@/components/ExamCard";
import { GraduationCap } from "lucide-react";

export const ExamsPage = () => {
  const { getUpcomingExams, getSubjectById, getNotesBySubject } = useOrbitData();
  
  const upcomingExams = getUpcomingExams();

  const getDaysUntil = (dateStr: string): number => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

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
              <p className="text-sm text-muted-foreground mt-1">
                Add exams in settings to track them here
              </p>
            </div>
          ) : (
            upcomingExams.map(exam => {
              const subject = getSubjectById(exam.subject_id);
              const notesCount = exam.subject_id ? getNotesBySubject(exam.subject_id).length : 0;
              
              return (
                <ExamCard 
                  key={exam.id} 
                  exam={{
                    ...exam,
                    subjectName: subject?.name || 'Unknown',
                    subjectIcon: subject?.icon || '📚',
                    subjectColorKey: (subject?.color_key || 'math') as any,
                    notesCount,
                    daysUntil: exam.exam_date ? getDaysUntil(exam.exam_date) : 0,
                  }}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
