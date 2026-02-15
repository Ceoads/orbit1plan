import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VaultFile, Subject } from "@/hooks/useVaultData";

interface FilingConfirmationBannerProps {
  file: VaultFile;
  subjects: Subject[];
  suggestedSubjectId: string | null;
  suggestedSubjectName: string | null;
  suggestedSubjectIcon: string | null;
  confidence: number;
  onConfirm: (subjectId: string, wasCorrect: boolean) => void;
  onDismiss: () => void;
}

const colorStyles: Record<string, string> = {
  math: "from-primary/20 to-primary/5 border-primary/30",
  history: "from-warning/20 to-warning/5 border-warning/30",
  physics: "from-success/20 to-success/5 border-success/30",
  english: "from-[hsl(280,67%,55%)]/20 to-[hsl(280,67%,55%)]/5 border-[hsl(280,67%,55%)]/30",
  chemistry: "from-destructive/20 to-destructive/5 border-destructive/30",
};

export const FilingConfirmationBanner = ({
  file,
  subjects,
  suggestedSubjectId,
  suggestedSubjectName,
  suggestedSubjectIcon,
  confidence,
  onConfirm,
  onDismiss,
}: FilingConfirmationBannerProps) => {
  const [showAlternatives, setShowAlternatives] = useState(!suggestedSubjectId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(suggestedSubjectId);
  const [isConfirming, setIsConfirming] = useState(false);

  // Update selectedSubjectId if suggestedSubjectId arrives later
  useEffect(() => {
    if (suggestedSubjectId && !selectedSubjectId) {
      setSelectedSubjectId(suggestedSubjectId);
      setShowAlternatives(false);
    }
  }, [suggestedSubjectId]);

  const suggestedSubject = subjects.find(s => s.id === suggestedSubjectId);
  const bgStyle = suggestedSubject 
    ? colorStyles[suggestedSubject.color_key] || colorStyles.math
    : "from-muted/50 to-muted/20 border-muted";

  const handleConfirm = async () => {
    if (selectedSubjectId) {
      setIsConfirming(true);
      onConfirm(selectedSubjectId, selectedSubjectId === suggestedSubjectId);
    }
  };

  const handleSelectAlternative = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setShowAlternatives(false);
  };

  const confidencePercent = Math.round(confidence * 100);
  const confidenceColor = confidence >= 0.8 ? 'text-success' : confidence >= 0.6 ? 'text-warning' : 'text-muted-foreground';

  const hasSelection = !!selectedSubjectId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={cn(
          "fixed top-20 left-4 right-4 z-50 p-4 rounded-2xl",
          "bg-gradient-to-br backdrop-blur-xl border-2 shadow-elevated",
          bgStyle
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              IA a détecté un document
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {file.ai_summary || 'Nouveau fichier capturé'}
            </p>
          </div>
          <button 
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-foreground/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Suggested Subject */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">
              {suggestedSubjectId ? 'Suggéré:' : 'Choisis une matière:'}
            </span>
            {suggestedSubjectId && (
              <span className={cn("text-xs font-medium", confidenceColor)}>
                {confidencePercent}% confiance
              </span>
            )}
          </div>

          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl",
              "bg-background/60 hover:bg-background/80 transition-colors",
              "border border-border/50",
              !hasSelection && "border-dashed border-primary/40"
            )}
          >
            <span className="text-2xl">{hasSelection ? (subjects.find(s => s.id === selectedSubjectId)?.icon || suggestedSubjectIcon || '📁') : '📁'}</span>
            <span className={cn("flex-1 text-left font-medium", hasSelection ? "text-foreground" : "text-muted-foreground")}>
              {hasSelection 
                ? (subjects.find(s => s.id === selectedSubjectId)?.name || suggestedSubjectName || 'Matière sélectionnée')
                : 'Sélectionner une matière ↓'}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              showAlternatives && "rotate-180"
            )} />
          </button>

          {/* Alternative subjects dropdown */}
          <AnimatePresence>
            {showAlternatives && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-1 overflow-hidden"
              >
                {subjects
                  .filter(s => s.id !== selectedSubjectId)
                  .map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => handleSelectAlternative(subject.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-lg",
                        "hover:bg-background/60 transition-colors",
                        selectedSubjectId === subject.id && "bg-background/60"
                      )}
                    >
                      <span className="text-xl">{subject.icon}</span>
                      <span className="text-sm text-foreground">{subject.name}</span>
                    </button>
                  ))
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleConfirm}
            disabled={!hasSelection || isConfirming}
            className="flex-1 gradient-primary"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Classement...
              </>
            ) : hasSelection ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmer ✓
              </>
            ) : (
              'Choisis une matière'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onDismiss}
            className="px-4"
          >
            Plus tard
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};