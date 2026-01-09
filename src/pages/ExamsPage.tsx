import { useState } from "react";
import { useOrbitData, CalendarEvent } from "@/hooks/useOrbitData";
import { ExamCard } from "@/components/ExamCard";
import { SwipeableItem } from "@/components/SwipeableItem";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExamModal, EditExamModal } from "@/components/modals";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ExamsPage = () => {
  const { getUpcomingExams, getSubjectById, getNotesBySubject, subjects, deleteEvent } = useOrbitData();
  const [showAddExam, setShowAddExam] = useState(false);
  const [editingExam, setEditingExam] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  
  const upcomingExams = getUpcomingExams();

  const getDaysUntil = (dateStr: string): number => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteEvent(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h1 className="font-display text-xl font-bold text-foreground flex-1">
          Exam Lab
        </h1>
        <Button 
          size="icon" 
          onClick={() => setShowAddExam(true)}
          className="rounded-full h-10 w-10 gradient-primary shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </Button>
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
                Tap the + button to add an exam
              </p>
            </div>
          ) : (
            upcomingExams.map(exam => {
              const subject = getSubjectById(exam.subject_id);
              const notesCount = exam.subject_id ? getNotesBySubject(exam.subject_id).length : 0;
              
              return (
                <SwipeableItem
                  key={exam.id}
                  onEdit={() => setEditingExam(exam)}
                  onDelete={() => setDeleteTarget({ id: exam.id, name: exam.title })}
                >
                  <ExamCard 
                    exam={{
                      ...exam,
                      subjectName: subject?.name || 'Unknown',
                      subjectIcon: subject?.icon || '📚',
                      subjectColorKey: (subject?.color_key || 'math') as any,
                      notesCount,
                      daysUntil: exam.exam_date ? getDaysUntil(exam.exam_date) : 0,
                    }}
                  />
                </SwipeableItem>
              );
            })
          )}
        </div>
      </section>

      {/* Modals */}
      <AddExamModal
        open={showAddExam}
        onOpenChange={setShowAddExam}
        subjects={subjects}
      />
      <EditExamModal
        open={!!editingExam}
        onOpenChange={(open) => !open && setEditingExam(null)}
        event={editingExam}
        subjects={subjects}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
