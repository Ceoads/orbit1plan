import { useState } from "react";
import { useOrbitData, CalendarEvent } from "@/hooks/useOrbitData";
import { ExamCard } from "@/components/ExamCard";
import { SwipeableItem } from "@/components/SwipeableItem";
import { BarChart3, CalendarClock, ChevronDown, GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradesPage } from "@/components/grades/GradesPage";
import { SemesterTasks } from "@/components/tasks/SemesterTasks";
import { cn } from "@/lib/utils";
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
  const [openSection, setOpenSection] = useState<"grades" | "deadlines" | null>(null);
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

      {/* Student results and semester planning */}
      <section className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpenSection((current) => current === "grades" ? null : "grades")}
          className="h-auto min-h-[64px] w-full justify-start gap-4 rounded-2xl bg-card px-4 py-3 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-card/90"
          aria-expanded={openSection === "grades"}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-foreground">Mes notes</span>
            <span className="block text-xs font-normal text-muted-foreground">Moyennes et résultats par matière</span>
          </span>
          <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", openSection === "grades" && "rotate-180")} />
        </Button>
        {openSection === "grades" && <div className="pt-2"><GradesPage /></div>}

        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpenSection((current) => current === "deadlines" ? null : "deadlines")}
          className="h-auto min-h-[64px] w-full justify-start gap-4 rounded-2xl bg-card px-4 py-3 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-card/90"
          aria-expanded={openSection === "deadlines"}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-foreground">Échéances du semestre</span>
            <span className="block text-xs font-normal text-muted-foreground">Dates importantes et rappels</span>
          </span>
          <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", openSection === "deadlines" && "rotate-180")} />
        </Button>
        {openSection === "deadlines" && <div className="pt-2"><SemesterTasks /></div>}
      </section>

      {/* Upcoming Exams */}
      <section>
        <h2 className="font-display font-semibold text-foreground mb-3">
          Examens à venir
        </h2>
        <div className="space-y-4">
          {upcomingExams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun examen planifié 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Appuie sur + pour ajouter un examen
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
                      subjectName: subject?.name || 'Inconnu',
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
            <AlertDialogTitle>Supprimer cet examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              Es-tu sûr de vouloir supprimer « {deleteTarget?.name} » ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
