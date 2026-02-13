import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Sparkles, ClipboardList, Check, Loader2, X, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

export interface CapturedNote {
  id: string;
  file_url: string;
  thumbnail_url?: string;
  extracted_text?: string;
  ai_summary?: string;
  subject_id?: string;
  subject_name?: string;
  subject_icon?: string;
}

interface PostCaptureActionMenuProps {
  capturedNote: CapturedNote | null;
  isVisible: boolean;
  onClose: () => void;
  onFileToVault: () => Promise<void>;
  onGenerateFlashcards: () => Promise<void>;
  onGenerateQuiz: () => Promise<void>;
  isProcessing?: boolean;
  processingAction?: 'vault' | 'flashcards' | 'quiz' | null;
  completedAction?: 'vault' | 'flashcards' | 'quiz' | null;
}

export const PostCaptureActionMenu = ({
  capturedNote,
  isVisible,
  onClose,
  onFileToVault,
  onGenerateFlashcards,
  onGenerateQuiz,
  isProcessing = false,
  processingAction = null,
  completedAction = null,
}: PostCaptureActionMenuProps) => {
  const haptics = useHaptics();

  const actions = [
    {
      id: 'vault' as const,
      label: 'Ranger',
      sublabel: 'Classer dans le Vault',
      icon: FolderOpen,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      action: onFileToVault,
    },
    {
      id: 'flashcards' as const,
      label: 'Étudier',
      sublabel: 'Générer des Flashcards',
      icon: Sparkles,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      action: onGenerateFlashcards,
    },
    {
      id: 'quiz' as const,
      label: "S'évaluer",
      sublabel: 'Créer un QCM',
      icon: ClipboardList,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      action: onGenerateQuiz,
    },
  ];

  const handleAction = async (action: typeof actions[0]) => {
    haptics.selection();
    await action.action();
  };

  if (!capturedNote) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Action Sheet */}
          <motion.div
            className="relative w-full max-w-lg mx-4 mb-safe-dock rounded-t-3xl bg-card border border-border shadow-elevated overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      Que faire de cette note ?
                    </h3>
                    {capturedNote.subject_name && (
                      <p className="text-xs text-muted-foreground">
                        {capturedNote.subject_icon} {capturedNote.subject_name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Thumbnail Preview */}
              {capturedNote.thumbnail_url || capturedNote.file_url ? (
                <div className="mt-3 relative rounded-xl overflow-hidden h-32 bg-muted">
                  <img
                    src={capturedNote.thumbnail_url || capturedNote.file_url}
                    alt="Note capturée"
                    className="w-full h-full object-cover"
                  />
                  {/* AI Processing Overlay */}
                  {isProcessing && processingAction !== 'vault' && (
                    <motion.div
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                          <Brain className="w-8 h-8 text-primary" />
                        </motion.div>
                        <p className="text-xs text-white font-medium">
                          {processingAction === 'flashcards' 
                            ? 'Génération des flashcards...' 
                            : 'Création du QCM...'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-3">
              {actions.map((action, index) => {
                const isCompleted = completedAction === action.id;
                const isCurrentlyProcessing = processingAction === action.id;
                const Icon = action.icon;

                return (
                  <motion.button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={isProcessing}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center gap-4",
                      "border transition-all duration-200",
                      "active:scale-[0.98] disabled:opacity-50",
                      isCompleted
                        ? "bg-success/10 border-success/40"
                        : `${action.bgColor} ${action.borderColor}`
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isCompleted ? "bg-success/20" : "bg-white/50"
                    )}>
                      {isCurrentlyProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : isCompleted ? (
                        <Check className="w-5 h-5 text-success" />
                      ) : (
                        <Icon className={cn("w-5 h-5", action.color)} />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className={cn(
                        "font-semibold",
                        isCompleted ? "text-success" : "text-foreground"
                      )}>
                        {isCompleted ? `${action.label} ✓` : action.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.sublabel}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
