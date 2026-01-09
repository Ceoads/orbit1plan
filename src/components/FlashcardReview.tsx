import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Check, X, RotateCcw, Sparkles, Brain, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mastered: boolean;
}

interface FlashcardReviewProps {
  flashcards: Flashcard[];
  onMarkMastered: (id: string, mastered: boolean) => void;
  onBack: () => void;
  subjectName?: string;
}

export const FlashcardReview = ({ 
  flashcards, 
  onMarkMastered, 
  onBack,
  subjectName 
}: FlashcardReviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;
  const masteredCount = flashcards.filter(f => f.mastered).length;

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentCard) return;
    
    setExitDirection(direction);
    
    // Right = mastered, Left = need to review
    onMarkMastered(currentCard.id, direction === "right");
    
    setTimeout(() => {
      setIsFlipped(false);
      setExitDirection(null);
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 300);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleSwipe("right");
    } else if (info.offset.x < -threshold) {
      handleSwipe("left");
    }
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Brain className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Aucune flashcard</h3>
        <p className="text-muted-foreground mb-4">
          Ajoute des notes avec des photos pour générer des flashcards automatiquement !
        </p>
        <Button onClick={onBack} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const isComplete = currentIndex >= flashcards.length - 1 && exitDirection;

  if (isComplete || (currentIndex === flashcards.length && !currentCard)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4"
        >
          <Sparkles className="w-10 h-10 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-2">Session terminée !</h3>
        <p className="text-muted-foreground mb-2">
          Tu as révisé {flashcards.length} cartes
        </p>
        <p className="text-lg font-semibold text-primary mb-6">
          {masteredCount}/{flashcards.length} maîtrisées ({Math.round((masteredCount / flashcards.length) * 100)}%)
        </p>
        <div className="flex gap-3">
          <Button onClick={resetProgress} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Recommencer
          </Button>
          <Button onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
        {subjectName && (
          <span className="text-sm font-medium text-muted-foreground">{subjectName}</span>
        )}
        <span className="text-sm font-medium">
          {currentIndex + 1}/{flashcards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id}
              className="w-full max-w-sm cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: exitDirection === "left" ? -300 : exitDirection === "right" ? 300 : 0,
                rotate: exitDirection === "left" ? -20 : exitDirection === "right" ? 20 : 0
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={cn(
                "relative w-full aspect-[3/4] rounded-2xl shadow-elevated",
                "bg-gradient-to-br from-card to-card/80",
                "border border-border/50",
                "flex flex-col items-center justify-center p-6 text-center",
                "transition-all duration-300",
                isFlipped && "bg-gradient-to-br from-primary/10 to-primary/5"
              )}>
                {/* Swipe indicators */}
                <motion.div 
                  className="absolute top-4 left-4 px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium opacity-0"
                  animate={{ opacity: exitDirection === "left" ? 1 : 0 }}
                >
                  À revoir
                </motion.div>
                <motion.div 
                  className="absolute top-4 right-4 px-3 py-1 rounded-full bg-green-500/20 text-green-600 text-sm font-medium opacity-0"
                  animate={{ opacity: exitDirection === "right" ? 1 : 0 }}
                >
                  Maîtrisé !
                </motion.div>

                {/* Card content */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                    {isFlipped ? "Réponse" : "Question"}
                  </span>
                  <p className={cn(
                    "text-lg font-medium leading-relaxed",
                    isFlipped ? "text-primary" : "text-foreground"
                  )}>
                    {isFlipped ? currentCard.answer : currentCard.question}
                  </p>
                </div>

                {/* Tap hint */}
                <p className="text-xs text-muted-foreground">
                  Tape pour {isFlipped ? "voir la question" : "voir la réponse"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6 p-6 pb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSwipe("left")}
          className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/30 hover:border-destructive transition-colors"
        >
          <X className="w-8 h-8 text-destructive" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSwipe("right")}
          className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border-2 border-green-500/30 hover:border-green-500 transition-colors"
        >
          <Check className="w-8 h-8 text-green-600" />
        </motion.button>
      </div>

      {/* Instructions */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        Swipe ← à revoir • Swipe → maîtrisé
      </p>
    </div>
  );
};
