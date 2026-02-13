import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, BookOpen, HelpCircle, CheckCircle2, XCircle, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  image_url?: string;
  mastered: boolean;
}

interface PracticeZoneProps {
  fileId: string;
  subjectId: string | null;
  extractedText: string | null;
  fileUrl: string;
  onQuizComplete: (score: number) => void;
}

export const PracticeZone = ({
  fileId,
  subjectId,
  extractedText,
  fileUrl,
  onQuizComplete,
}: PracticeZoneProps) => {
  const { user } = useAuth();
  const haptics = useHaptics();
  const { t } = useTranslation();
  
  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  
  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fetch existing flashcards for this note
  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user || !fileId) return;

      const query = supabase
        .from('flashcards')
        .select('*')
        .eq('note_id', fileId)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data, error } = await query;

      if (!error && data) {
        setFlashcards(data as Flashcard[]);
      }
    };

    fetchFlashcards();
  }, [user, fileId]);

  // Generate Quiz
  const handleGenerateQuiz = async () => {
    if (!extractedText && !fileUrl) {
      toast.error(t("studyHub.noContentToAnalyze"));
      return;
    }

    setLoadingQuiz(true);
    haptics.selection();
    toast.loading(`🧠 ${t("studyHub.generatingQuiz")}`, { id: "quiz" });

    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          extractedText,
          imageBase64: fileUrl,
          noteId: fileId,
          subjectId,
        },
      });

      if (error) throw error;

      if (data?.quiz) {
        setQuiz(data.quiz);
        setCurrentQuestion(0);
        setQuizAnswers([]);
        setQuizComplete(false);
        toast.dismiss("quiz");
        toast.success(`✨ ${t("studyHub.quizGenerated")}`);
        haptics.success();
      } else {
        throw new Error('No quiz generated');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.dismiss("quiz");
      toast.error(t("studyHub.quizError"));
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Generate Flashcards
  const handleGenerateFlashcards = async () => {
    if (!extractedText) {
      toast.error(t("studyHub.noTextForFlashcards"));
      return;
    }

    setLoadingFlashcards(true);
    haptics.selection();
    toast.loading(`🎴 ${t("studyHub.generatingFlashcards")}`, { id: "flashcards" });

    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: {
          noteContent: extractedText,
          noteId: fileId,
          subjectId,
        },
      });

      if (error) throw error;

      if (data?.flashcards?.length > 0) {
        // Save flashcards to Supabase for persistence (Lab reads from DB)
        const savedFlashcards: Flashcard[] = [];
        for (const card of data.flashcards) {
          const { data: saved, error: saveError } = await supabase
            .from('flashcards')
            .insert({
              user_id: user.id,
              question: card.question,
              answer: card.answer,
              image_url: card.image_url || null,
              image_prompt: card.image_prompt || null,
              subject_id: subjectId,
              note_id: fileId,
              mastered: false,
            })
            .select()
            .single();

          if (!saveError && saved) {
            savedFlashcards.push(saved as Flashcard);
          } else {
            console.error('Error saving flashcard:', saveError);
          }
        }

        setFlashcards(prev => [...savedFlashcards, ...prev]);
        setCurrentCard(0);
        toast.dismiss("flashcards");
        toast.success(`🎴 ${savedFlashcards.length} ${t("studyHub.flashcardsCreated")}`);
        haptics.success();
      } else {
        throw new Error('No flashcards generated');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.dismiss("flashcards");
      toast.error(t("studyHub.flashcardsError"));
    } finally {
      setLoadingFlashcards(false);
    }
  };

  // Quiz answer handling
  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(index);
    setShowExplanation(true);
    
    const isCorrect = index === quiz?.questions[currentQuestion].correctIndex;
    setQuizAnswers(prev => [...prev, isCorrect]);
    
    isCorrect ? haptics.success() : haptics.soft();
  };

  const handleNextQuestion = () => {
    haptics.selection();
    
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz complete
      const score = Math.round((quizAnswers.filter(Boolean).length / quizAnswers.length) * 100);
      setQuizComplete(true);
      onQuizComplete(score);
    }
  };

  // Flashcard handling
  const handleFlipCard = () => {
    haptics.selection();
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    haptics.selection();
    setIsFlipped(false);
    setCurrentCard(prev => Math.min(prev + 1, flashcards.length - 1));
  };

  const handlePrevCard = () => {
    haptics.selection();
    setIsFlipped(false);
    setCurrentCard(prev => Math.max(prev - 1, 0));
  };

  const currentQuizQuestion = quiz?.questions[currentQuestion];
  const quizScore = quizComplete 
    ? Math.round((quizAnswers.filter(Boolean).length / quizAnswers.length) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden"
    >
      <Tabs defaultValue="quiz" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 m-0 rounded-none">
          <TabsTrigger 
            value="quiz" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            {t("studyHub.quiz")}
          </TabsTrigger>
          <TabsTrigger 
            value="flashcards"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {t("studyHub.flashcards")}
          </TabsTrigger>
        </TabsList>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="p-4 m-0">
          {!quiz ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {t("studyHub.testKnowledge")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("studyHub.generateQuizDesc")}
              </p>
              <Button
                onClick={handleGenerateQuiz}
                disabled={loadingQuiz}
                className="gradient-primary text-primary-foreground rounded-xl"
              >
                {loadingQuiz ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                {t("studyHub.generateQuiz")}
              </Button>
            </div>
          ) : quizComplete ? (
            <div className="text-center py-8">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                quizScore >= 80 ? "bg-success/10" : quizScore >= 50 ? "bg-warning/10" : "bg-destructive/10"
              )}>
                <span className={cn(
                  "text-3xl font-bold",
                  quizScore >= 80 ? "text-success" : quizScore >= 50 ? "text-warning" : "text-destructive"
                )}>
                  {quizScore}%
                </span>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {quizScore >= 80 ? `🎉 ${t("studyHub.excellent")}` : quizScore >= 50 ? `👍 ${t("studyHub.notBad")}` : `💪 ${t("studyHub.keepGoing")}`}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {quizAnswers.filter(Boolean).length}/{quizAnswers.length} {t("studyHub.correctAnswers")}
              </p>
              <Button
                onClick={() => {
                  setQuiz(null);
                  setQuizComplete(false);
                }}
                variant="outline"
                className="rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("studyHub.newQuiz")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                    transition={{ type: "spring", bounce: 0.2 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {currentQuestion + 1}/{quiz.questions.length}
                </span>
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", bounce: 0.2 }}
                >
                  <h4 className="font-semibold text-foreground mb-4">
                    {currentQuizQuestion?.question}
                  </h4>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentQuizQuestion?.options.map((option, index) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = index === currentQuizQuestion.correctIndex;
                      const showResult = selectedAnswer !== null;

                      return (
                        <button
                          key={index}
                          onClick={() => handleSelectAnswer(index)}
                          disabled={selectedAnswer !== null}
                          className={cn(
                            "w-full p-3 rounded-xl border text-left transition-all",
                            !showResult && "hover:border-primary hover:bg-primary/5",
                            showResult && isCorrect && "border-success bg-success/10",
                            showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                            !showResult && "border-border bg-background"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              showResult && isCorrect ? "bg-success text-success-foreground" :
                              showResult && isSelected ? "bg-destructive text-destructive-foreground" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {showResult && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                               showResult && isSelected ? <XCircle className="w-4 h-4" /> :
                               String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-sm">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 p-3 rounded-xl bg-muted/50 border border-border"
                    >
                      <p className="text-sm text-muted-foreground">
                        💡 {currentQuizQuestion?.explanation}
                      </p>
                    </motion.div>
                  )}

                  {/* Next button */}
                  {selectedAnswer !== null && (
                    <Button
                      onClick={handleNextQuestion}
                      className="w-full mt-4 gradient-primary text-primary-foreground rounded-xl"
                    >
                      {currentQuestion < quiz.questions.length - 1 ? t("studyHub.nextQuestion") : t("studyHub.seeScore")}
                    </Button>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="p-4 m-0">
          {flashcards.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {t("studyHub.createFlashcards")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("studyHub.generateFlashcardsDesc")}
              </p>
              <Button
                onClick={handleGenerateFlashcards}
                disabled={loadingFlashcards || !extractedText}
                className="gradient-primary text-primary-foreground rounded-xl"
              >
                {loadingFlashcards ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BookOpen className="w-4 h-4 mr-2" />
                )}
                {t("studyHub.generateFlashcards")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card counter */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("studyHub.card")} {currentCard + 1} / {flashcards.length}
                </span>
                <Button
                  onClick={handleGenerateFlashcards}
                  disabled={loadingFlashcards}
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-1", loadingFlashcards && "animate-spin")} />
                  {t("studyHub.moreCards")}
                </Button>
              </div>

              {/* Flashcard */}
              <div
                onClick={handleFlipCard}
                className="relative aspect-[4/3] cursor-pointer perspective-1000"
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center text-center backface-hidden"
                  style={{
                    transformStyle: "preserve-3d",
                    rotateY: isFlipped ? 180 : 0,
                  }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Front - Question */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center",
                      "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20",
                      "backface-hidden"
                    )}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    {flashcards[currentCard]?.image_url && (
                      <img
                        src={flashcards[currentCard].image_url}
                        alt=""
                        className="w-24 h-24 object-contain mb-4 rounded-xl"
                      />
                    )}
                    <p className="font-medium text-foreground">
                      {flashcards[currentCard]?.question}
                    </p>
                    <span className="absolute bottom-4 text-xs text-muted-foreground">
                      Touche pour voir la réponse
                    </span>
                  </div>

                  {/* Back - Answer */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center",
                      "bg-gradient-to-br from-success/10 to-success/5 border border-success/20",
                      "backface-hidden"
                    )}
                    style={{ 
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    <p className="font-medium text-foreground">
                      {flashcards[currentCard]?.answer}
                    </p>
                    <span className="absolute bottom-4 text-xs text-muted-foreground">
                      Touche pour revenir
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  onClick={handlePrevCard}
                  disabled={currentCard === 0}
                  variant="outline"
                  size="icon"
                  className="rounded-xl hit-target"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex gap-1">
                  {flashcards.slice(0, 5).map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        idx === currentCard ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                  {flashcards.length > 5 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{flashcards.length - 5}
                    </span>
                  )}
                </div>

                <Button
                  onClick={handleNextCard}
                  disabled={currentCard === flashcards.length - 1}
                  variant="outline"
                  size="icon"
                  className="rounded-xl hit-target"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
