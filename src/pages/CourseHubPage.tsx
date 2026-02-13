import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { MapPin, Clock, User, Camera, Upload, ChevronDown, Sparkles, FolderOpen, Check, FileText, Brain } from "lucide-react";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useVaultData } from "@/hooks/useVaultData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { PostCaptureActionMenu, CapturedNote } from "@/components/vault/PostCaptureActionMenu";

export const CourseHubPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, subjects, createNote } = useOrbitData();
  const { createFile, subjects: vaultSubjects } = useVaultData();
  const haptics = useHaptics();
  const sounds = useSoundEffects();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [capturedNote, setCapturedNote] = useState<CapturedNote | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'vault' | 'flashcards' | 'quiz' | null>(null);
  const [completedAction, setCompletedAction] = useState<'vault' | 'flashcards' | 'quiz' | null>(null);
  const [noteStats, setNoteStats] = useState({ notes: 0, flashcards: 0 });
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find the event
  const event = events.find(e => e.id === eventId);
  const subject = event?.subject_id ? subjects.find(s => s.id === event.subject_id) : null;

  // Load note stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user || !subject) return;
      
      const [notesRes, flashcardsRes] = await Promise.all([
        supabase.from('notes_vault').select('id', { count: 'exact' }).eq('subject_id', subject.id),
        supabase.from('flashcards').select('id', { count: 'exact' }).eq('subject_id', subject.id),
      ]);
      
      setNoteStats({
        notes: notesRes.count || 0,
        flashcards: flashcardsRes.count || 0,
      });
    };
    loadStats();
  }, [user, subject]);

  // Swipe to dismiss
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);
  const scale = useTransform(y, [0, 200], [1, 0.95]);

  // Trigger haptic on mount
  useEffect(() => {
    haptics.soft();
    sounds.open();
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      haptics.selection();
      sounds.close();
      navigate(-1);
    }
  };

  const getSubjectColors = (colorKey: string) => {
    const colorMap: Record<string, { gradient: string; bg: string }> = {
      math: { gradient: 'from-subject-math/30 to-subject-math/10', bg: 'bg-subject-math' },
      history: { gradient: 'from-subject-history/30 to-subject-history/10', bg: 'bg-subject-history' },
      physics: { gradient: 'from-subject-physics/30 to-subject-physics/10', bg: 'bg-subject-physics' },
      english: { gradient: 'from-subject-english/30 to-subject-english/10', bg: 'bg-subject-english' },
      chemistry: { gradient: 'from-subject-chemistry/30 to-subject-chemistry/10', bg: 'bg-subject-chemistry' },
    };
    return colorMap[colorKey] || { gradient: 'from-primary/20 to-primary/5', bg: 'bg-primary' };
  };

  const colors = getSubjectColors(subject?.color_key || 'history');

  const processImage = async (file: File) => {
    if (!user || !event) {
      toast.error("Erreur de contexte");
      return;
    }

    setIsProcessing(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;
      setCapturedImageBase64(base64);

      toast.loading("🧠 Analyse en cours...", { id: "processing" });

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("notes")
        .createSignedUrl(fileName, 3600);
      
      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error("Failed to get signed URL");
      }
      const publicUrl = signedUrlData.signedUrl;

      // Process with AI for OCR
      const { data: aiResult, error: aiError } = await supabase.functions.invoke("process-note", {
        body: { imageBase64: base64, action: "ocr" },
      });

      if (aiError) throw aiError;

      toast.dismiss("processing");
      
      // Store captured note info for action menu
      setCapturedNote({
        id: '', // Will be set after filing
        file_url: publicUrl,
        thumbnail_url: publicUrl,
        extracted_text: aiResult.rawText || null,
        ai_summary: aiResult.aiSummary || null,
        subject_id: subject?.id,
        subject_name: subject?.name,
        subject_icon: subject?.icon,
      });

      // Show action menu
      haptics.soft();
      setShowActionMenu(true);

    } catch (error: any) {
      console.error("Error processing image:", error);
      toast.dismiss("processing");
      toast.error("Échec du traitement");
      haptics.error();
      setIsProcessing(false);
    }
  };

  // File to Vault action
  const handleFileToVault = async () => {
    if (!capturedNote || !user || !event) return;
    
    setProcessingAction('vault');
    
    try {
      // Create vault file with subject auto-mapped
      const newFile = await createFile({
        file_url: capturedNote.file_url,
        thumbnail_url: capturedNote.thumbnail_url,
        extracted_text: capturedNote.extracted_text,
        ai_summary: capturedNote.ai_summary,
        subject_id: subject?.id || null,
        ai_detected_subject: subject?.name,
        ai_confidence: 1.0, // High confidence since manually from course hub
        filing_status: 'confirmed',
        file_type: 'image',
        tags: [subject?.name || 'cours'].filter(Boolean),
      });

      // Also save to notes_vault for backwards compatibility
      await supabase.from("notes_vault").insert({
        user_id: user.id,
        subject_id: subject?.id || null,
        event_id: event.id,
        media_url: capturedNote.file_url,
        raw_text: capturedNote.extracted_text || null,
        ai_summary: capturedNote.ai_summary || null,
      });

      if (newFile) {
        setCapturedNote(prev => prev ? { ...prev, id: newFile.id } : null);
      }

      // Success feedback
      haptics.success();
      sounds.success();
      setCompletedAction('vault');
      setCaptureSuccess(true);
      
      // Update stats
      setNoteStats(prev => ({ ...prev, notes: prev.notes + 1 }));
      
      toast.success(`📁 Note classée dans ${subject?.icon || '📚'} ${subject?.name || 'Vault'}`, {
        description: "Classement automatique effectué",
        action: {
          label: "Voir le dossier",
          onClick: () => navigate('/vault'),
        },
      });

    } catch (error: any) {
      console.error("Error filing to vault:", error);
      toast.error("Échec du classement");
      haptics.error();
    } finally {
      setProcessingAction(null);
    }
  };

  // Generate Flashcards action
  const handleGenerateFlashcards = async () => {
    if (!capturedNote || !capturedImageBase64 || !user) return;
    
    setProcessingAction('flashcards');
    
    try {
      toast.loading("🎴 Génération des flashcards...", { id: "flashcards" });

      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: {
          imageBase64: capturedImageBase64,
          subjectId: subject?.id,
          generateImages: true,
        },
      });

      if (error) throw error;

      const flashcards = data.flashcards || [];
      
      if (flashcards.length === 0) {
        toast.dismiss("flashcards");
        toast.error("Aucune flashcard générée");
        return;
      }

      // Save flashcards to database
      const flashcardsToInsert = flashcards.map((card: any) => ({
        user_id: user.id,
        subject_id: subject?.id || null,
        question: card.question,
        answer: card.answer,
        image_url: card.image_url || null,
        image_prompt: card.image_prompt || null,
      }));

      await supabase.from("flashcards").insert(flashcardsToInsert);

      toast.dismiss("flashcards");
      haptics.success();
      sounds.success();
      setCompletedAction('flashcards');
      
      // Update stats
      setNoteStats(prev => ({ ...prev, flashcards: prev.flashcards + flashcards.length }));
      
      const visualCount = flashcards.filter((f: any) => f.image_url).length;
      toast.success(`🎴 ${flashcards.length} flashcards créées !`, {
        description: visualCount > 0 ? `${visualCount} avec illustrations IA` : undefined,
        action: {
          label: "Réviser",
          onClick: () => navigate('/lab'),
        },
      });

    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      toast.dismiss("flashcards");
      toast.error("Échec de la génération");
      haptics.error();
    } finally {
      setProcessingAction(null);
    }
  };

  // Generate Quiz action
  const handleGenerateQuiz = async () => {
    if (!capturedNote || !capturedImageBase64) return;
    
    setProcessingAction('quiz');
    
    try {
      toast.loading("📝 Création du QCM...", { id: "quiz" });

      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          imageBase64: capturedImageBase64,
          extractedText: capturedNote.extracted_text,
          subjectId: subject?.id,
        },
      });

      if (error) throw error;

      const quiz = data.quiz;
      
      if (!quiz || !quiz.questions?.length) {
        toast.dismiss("quiz");
        toast.error("Aucun QCM généré");
        return;
      }

      toast.dismiss("quiz");
      haptics.success();
      sounds.success();
      setCompletedAction('quiz');
      
      toast.success(`📝 QCM de ${quiz.questions.length} questions créé !`, {
        description: quiz.title,
        action: {
          label: "Commencer",
          onClick: () => {
            // Store quiz in localStorage for now (can be moved to DB later)
            localStorage.setItem('currentQuiz', JSON.stringify(quiz));
            navigate('/lab');
          },
        },
      });

    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast.dismiss("quiz");
      toast.error("Échec de la génération");
      haptics.error();
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCloseActionMenu = () => {
    setShowActionMenu(false);
    setIsProcessing(false);
    setCapturedImageBase64(null);
    setProcessingAction(null);
    setCompletedAction(null);
    
    // Keep success state for UI animation
    if (completedAction) {
      setTimeout(() => {
        setCaptureSuccess(false);
        setCapturedNote(null);
      }, 3000);
    } else {
      setCapturedNote(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
    e.target.value = "";
  };

  const handleCameraCapture = () => {
    haptics.selection();
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    haptics.selection();
    fileInputRef.current?.click();
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">Cours non trouvé</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Retour
          </Button>
        </GlassCard>
      </div>
    );
  }

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <>
      <motion.div
        className="min-h-screen bg-gradient-warm"
        style={{ opacity, scale }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
      >
        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Drag indicator */}
        <motion.div 
          className="flex justify-center pt-4 pb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-10 h-1 rounded-full bg-foreground/20" />
        </motion.div>

        {/* Swipe hint */}
        <motion.div
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <ChevronDown className="w-3 h-3 animate-bounce" />
          <span>Glissez pour fermer</span>
        </motion.div>

        <div className="px-4 pb-8 space-y-6 mb-safe-dock">
          {/* Course Header - Glassmorphism */}
          <motion.div
            className={cn(
              "rounded-3xl p-6 backdrop-blur-2xl border border-white/40 shadow-elevated",
              "bg-gradient-to-br",
              colors.gradient
            )}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            layoutId={`course-${event.id}`}
          >
            {/* Subject icon badge */}
            {subject && (
              <motion.div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4",
                  colors.bg + "/20",
                  "border border-white/30"
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-lg">{subject.icon}</span>
                <span className="text-sm font-semibold text-foreground">{subject.name}</span>
              </motion.div>
            )}

            {/* Course Title - Dynamic Typography */}
            <motion.h1 
              className="text-dynamic-title font-display font-bold text-foreground mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              {subject?.name || event.title}
            </motion.h1>

            {/* Course Details Grid */}
            <div className="space-y-3">
              {/* Time & Day */}
              <motion.div 
                className="flex items-center gap-3 text-foreground/80"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {dayNames[event.day_of_week]} • {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                  </p>
                  <p className="text-xs text-muted-foreground">Horaire hebdomadaire</p>
                </div>
              </motion.div>

              {/* Room */}
              {event.room_number && (
                <motion.div 
                  className="flex items-center gap-3 text-foreground/80"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{event.room_number}</p>
                    <p className="text-xs text-muted-foreground">Salle de cours</p>
                  </div>
                </motion.div>
              )}

              {/* Teacher */}
              {(event.teacher_name || subject?.teacher_name) && (
                <motion.div 
                  className="flex items-center gap-3 text-foreground/80"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur flex items-center justify-center">
                    <User className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{event.teacher_name || subject?.teacher_name}</p>
                    <p className="text-xs text-muted-foreground">Professeur</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Auto-Vault Scanner Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground">Auto-Vault</h2>
                  <p className="text-xs text-muted-foreground">
                    Capture → Classement automatique dans {subject?.icon} {subject?.name || 'Vault'}
                  </p>
                </div>
              </div>

              {/* Success Animation Overlay */}
              <AnimatePresence>
                {captureSuccess && (
                  <motion.div
                    className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-success/10 border border-success/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10, stiffness: 200 }}
                    >
                      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-success" />
                      </div>
                    </motion.div>
                    <div>
                      <p className="font-semibold text-success">Note classée !</p>
                      <button
                        onClick={() => navigate('/vault')}
                        className="text-xs text-success/70 hover:text-success underline"
                      >
                        Voir le dossier: {subject?.icon} {subject?.name}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Capture Buttons */}
              {!captureSuccess && (
                <div className="space-y-3">
                  {/* Primary Camera Button */}
                  <motion.button
                    onClick={handleCameraCapture}
                    disabled={isProcessing}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center gap-4",
                      "bg-gradient-to-r from-primary to-primary/80",
                      "text-primary-foreground font-semibold",
                      "shadow-lg shadow-primary/30",
                      "active:scale-[0.98] transition-transform",
                      "disabled:opacity-60"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      {isProcessing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                          <Brain className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <Camera className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold">
                        {isProcessing ? "Analyse IA en cours..." : "Prendre une photo des notes"}
                      </p>
                      <p className="text-xs opacity-80">
                        {isProcessing 
                          ? "OCR et détection du contenu" 
                          : `Rangement auto dans ${subject?.name || 'Vault'}`}
                      </p>
                    </div>
                  </motion.button>

                  {/* Secondary Upload Button */}
                  <motion.button
                    onClick={handleFileUpload}
                    disabled={isProcessing}
                    className={cn(
                      "w-full p-3 rounded-2xl flex items-center gap-3",
                      "bg-white/50 backdrop-blur border border-white/40",
                      "text-foreground font-medium",
                      "active:scale-[0.98] transition-transform",
                      "disabled:opacity-60"
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm">Importer depuis la galerie</span>
                  </motion.button>
                </div>
              )}

              {/* Vault Link */}
              <motion.button
                onClick={() => {
                  haptics.selection();
                  navigate('/vault');
                }}
                className="w-full p-3 rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Voir toutes les notes de ce cours</span>
              </motion.button>
            </GlassCard>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <GlassCard 
              className="p-4 text-center cursor-pointer hover:bg-white/60 transition-colors"
              onClick={() => navigate('/vault')}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-2xl font-bold text-primary">{noteStats.notes}</p>
              </div>
              <p className="text-xs text-muted-foreground">Notes capturées</p>
            </GlassCard>
            <GlassCard 
              className="p-4 text-center cursor-pointer hover:bg-white/60 transition-colors"
              onClick={() => navigate('/lab')}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-success" />
                <p className="text-2xl font-bold text-success">{noteStats.flashcards}</p>
              </div>
              <p className="text-xs text-muted-foreground">Flashcards</p>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Post-Capture Action Menu */}
      <PostCaptureActionMenu
        capturedNote={capturedNote}
        isVisible={showActionMenu}
        onClose={handleCloseActionMenu}
        onFileToVault={handleFileToVault}
        onGenerateFlashcards={handleGenerateFlashcards}
        onGenerateQuiz={handleGenerateQuiz}
        isProcessing={!!processingAction}
        processingAction={processingAction}
        completedAction={completedAction}
      />
    </>
  );
};
