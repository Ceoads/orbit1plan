import { useState, useEffect } from "react";
import { toLocalDateStr } from "@/lib/dateFormat";
import { motion } from "framer-motion";
import { Brain, Sparkles, BookOpen, Plus, Loader2, AlertCircle, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { FlashcardReview } from "@/components/FlashcardReview";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mastered: boolean;
  subject_id: string | null;
  note_id: string | null;
  review_count: number;
}

interface Subject {
  id: string;
  name: string;
  color_key: string;
  icon: string;
}

interface UpcomingExam {
  id: string;
  title: string;
  exam_date: string;
  subject_id: string | null;
  daysUntil: number;
}

export const ExamLabPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch flashcards
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (flashcardsError) throw flashcardsError;
      setFlashcards(flashcardsData || []);

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id);

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch upcoming exams
      const today = toLocalDateStr(new Date());
      const { data: examsData, error: examsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_type', 'exam')
        .gte('exam_date', today)
        .order('exam_date', { ascending: true })
        .limit(5);

      if (examsError) throw examsError;
      
      const examsWithDays = (examsData || []).map(exam => ({
        ...exam,
        daysUntil: Math.ceil((new Date(exam.exam_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }));
      setUpcomingExams(examsWithDays);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMastered = async (id: string, mastered: boolean) => {
    const flashcard = flashcards.find(f => f.id === id);
    if (!flashcard) return;

    try {
      const { error } = await supabase
        .from('flashcards')
        .update({ 
          mastered,
          review_count: flashcard.review_count + 1,
          last_reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setFlashcards(prev => prev.map(f => 
        f.id === id ? { ...f, mastered, review_count: f.review_count + 1 } : f
      ));
    } catch (error) {
      console.error('Error updating flashcard:', error);
    }
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return "Général";
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || "Général";
  };

  const getSubjectColor = (subjectId: string | null) => {
    if (!subjectId) return "bg-muted";
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color_key ? `bg-subject-${subject.color_key}` : "bg-muted";
  };

  const filteredFlashcards = selectedSubject
    ? flashcards.filter(f => f.subject_id === selectedSubject)
    : flashcards;

  const masteredCount = filteredFlashcards.filter(f => f.mastered).length;
  const readinessScore = filteredFlashcards.length > 0 
    ? Math.round((masteredCount / filteredFlashcards.length) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isReviewing) {
    return (
      <FlashcardReview
        flashcards={filteredFlashcards}
        onMarkMastered={handleMarkMastered}
        onBack={() => setIsReviewing(false)}
        subjectName={selectedSubject ? getSubjectName(selectedSubject) : undefined}
      />
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Exam Lab</h1>
          <p className="text-sm text-muted-foreground">
            Révise avec des flashcards intelligentes
          </p>
        </div>
      </div>

      {/* Upcoming Exams Alert */}
      {upcomingExams.length > 0 && upcomingExams[0].daysUntil <= 3 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="border-l-4 border-l-destructive bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">
                  Examen dans {upcomingExams[0].daysUntil} jour{upcomingExams[0].daysUntil > 1 ? 's' : ''} !
                </p>
                <p className="text-sm text-muted-foreground">
                  {upcomingExams[0].title} - Es-tu prêt ?
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Readiness Score */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold">Score de préparation</span>
          </div>
          <span className={cn(
            "text-2xl font-bold",
            readinessScore >= 80 ? "text-green-600" :
            readinessScore >= 50 ? "text-yellow-600" : "text-destructive"
          )}>
            {readinessScore}%
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className={cn(
              "h-full rounded-full",
              readinessScore >= 80 ? "bg-green-500" :
              readinessScore >= 50 ? "bg-yellow-500" : "bg-destructive"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${readinessScore}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {masteredCount} / {filteredFlashcards.length} flashcards maîtrisées
        </p>
      </GlassCard>

      {/* Subject Filter */}
      {subjects.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setSelectedSubject(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              !selectedSubject
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Toutes ({flashcards.length})
          </button>
          {subjects.map(subject => {
            const count = flashcards.filter(f => f.subject_id === subject.id).length;
            if (count === 0) return null;
            return (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedSubject === subject.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {subject.icon} {subject.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Start Review Button */}
      {filteredFlashcards.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button
            onClick={() => setIsReviewing(true)}
            className="w-full h-14 text-lg gap-3"
            size="lg"
            data-tutorial="review-button"
          >
            <BookOpen className="w-5 h-5" />
            Commencer la révision
            <span className="text-primary-foreground/70">
              ({filteredFlashcards.length} cartes)
            </span>
          </Button>
        </motion.div>
      ) : (
        <GlassCard className="text-center py-8" data-tutorial="empty-flashcards">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Aucune flashcard</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Prends une photo de tes cours avec Smart Capture pour générer des flashcards automatiquement !
          </p>
        </GlassCard>
      )}

      {/* Upcoming Exams List */}
      {upcomingExams.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Examens à venir
          </h2>
          {upcomingExams.map(exam => {
            const examFlashcards = flashcards.filter(f => f.subject_id === exam.subject_id);
            const examMastered = examFlashcards.filter(f => f.mastered).length;
            const examReadiness = examFlashcards.length > 0 
              ? Math.round((examMastered / examFlashcards.length) * 100) 
              : 0;

            return (
              <GlassCard key={exam.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{exam.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Dans {exam.daysUntil} jour{exam.daysUntil > 1 ? 's' : ''} • {examFlashcards.length} flashcards
                  </p>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold",
                  examReadiness >= 80 ? "bg-green-100 text-green-700" :
                  examReadiness >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                )}>
                  {examReadiness}%
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="text-center py-4">
          <p className="text-2xl font-bold text-primary">{flashcards.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <p className="text-2xl font-bold text-green-600">{masteredCount}</p>
          <p className="text-xs text-muted-foreground">Maîtrisées</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <p className="text-2xl font-bold text-yellow-600">{flashcards.length - masteredCount}</p>
          <p className="text-xs text-muted-foreground">À revoir</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default ExamLabPage;
