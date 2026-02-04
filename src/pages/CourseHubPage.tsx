import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Clock, User, Camera, Upload, ChevronDown, Sparkles, FolderOpen, Check } from "lucide-react";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";

export const CourseHubPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, subjects, createNote } = useOrbitData();
  const haptics = useHaptics();
  const sounds = useSoundEffects();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find the event
  const event = events.find(e => e.id === eventId);
  const subject = event?.subject_id ? subjects.find(s => s.id === event.subject_id) : null;

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

      toast.loading("🧠 Analyse en cours...", { id: "processing" });

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("notes")
        .getPublicUrl(fileName);

      // Process with AI
      const { data: aiResult, error: aiError } = await supabase.functions.invoke("process-note", {
        body: { imageBase64: base64, action: "ocr" },
      });

      if (aiError) throw aiError;

      // Save note - AUTOMATICALLY filed to the correct subject!
      const { error: noteError } = await supabase.from("notes_vault").insert({
        user_id: user.id,
        subject_id: subject?.id || null, // Auto-filed to current course's subject
        event_id: event.id,
        media_url: publicUrl,
        raw_text: aiResult.rawText || null,
        ai_summary: aiResult.aiSummary || null,
      });

      if (noteError) throw noteError;

      toast.dismiss("processing");
      
      // Success feedback
      haptics.success();
      sounds.success();
      setCaptureSuccess(true);
      
      toast.success(`📁 Note rangée dans ${subject?.icon || '📚'} ${subject?.name || 'Vault'}`, {
        description: "Classement automatique effectué",
        duration: 4000,
      });

      // Reset success state after animation
      setTimeout(() => setCaptureSuccess(false), 3000);

    } catch (error: any) {
      console.error("Error processing image:", error);
      toast.dismiss("processing");
      toast.error("Échec du traitement");
      haptics.error();
    } finally {
      setIsProcessing(false);
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
                  <p className="text-xs text-success/70">
                    Dossier: {subject?.icon} {subject?.name}
                  </p>
                </div>
              </motion.div>
            )}

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
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold">Prendre une photo des notes</p>
                    <p className="text-xs opacity-80">
                      Rangement auto dans {subject?.name || 'Vault'}
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

        {/* Quick Stats (Optional Enhancement) */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Notes capturées</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-success">0</p>
            <p className="text-xs text-muted-foreground">Flashcards</p>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
};
