import { useState, useRef } from "react";
import { Camera, Mic, Plus, X, Upload, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SmartCaptureButtonProps {
  currentSubject?: { id: string; name: string; icon: string } | null;
  onNoteCreated?: () => void;
  generateFlashcards?: boolean;
}

export const SmartCaptureButton = ({ currentSubject, onNoteCreated, generateFlashcards = true }: SmartCaptureButtonProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    if (!user) {
      toast.error("Connecte-toi pour capturer des notes");
      return;
    }

    setIsProcessing(true);
    setIsExpanded(false);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      toast.loading("🧠 L'IA analyse ta note...", { id: "processing" });

      // Upload to storage first
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Process with AI
      const { data: aiResult, error: aiError } = await supabase.functions.invoke("process-note", {
        body: { imageBase64: base64, action: "ocr" },
      });

      if (aiError) throw aiError;

      // Save note to database
      const { data: noteData, error: noteError } = await supabase.from("notes_vault").insert({
        user_id: user.id,
        subject_id: currentSubject?.id || null,
        media_url: publicUrl,
        raw_text: aiResult.rawText || null,
        ai_summary: aiResult.aiSummary || null,
      }).select().single();

      if (noteError) throw noteError;

      toast.dismiss("processing");
      toast.success(`📸 Note capturée !`, {
        description: currentSubject 
          ? `Tagué comme ${currentSubject.icon} ${currentSubject.name}`
          : "Sauvegardé dans ton coffre",
      });

      // Generate flashcards automatically
      if (generateFlashcards && noteData) {
        toast.loading("✨ Génération des flashcards...", { id: "flashcards" });
        
        try {
          const { data: flashcardsResult, error: flashcardsError } = await supabase.functions.invoke("generate-flashcards", {
            body: { 
              imageBase64: base64, 
              noteId: noteData.id,
              subjectId: currentSubject?.id || null 
            },
          });

          if (flashcardsError) throw flashcardsError;

          if (flashcardsResult.flashcards && flashcardsResult.flashcards.length > 0) {
            // Save flashcards to database
            const flashcardsToInsert = flashcardsResult.flashcards.map((fc: { question: string; answer: string }) => ({
              user_id: user.id,
              subject_id: currentSubject?.id || null,
              note_id: noteData.id,
              question: fc.question,
              answer: fc.answer,
              mastered: false,
            }));

            const { error: insertError } = await supabase
              .from('flashcards')
              .insert(flashcardsToInsert);

            if (insertError) throw insertError;

            toast.dismiss("flashcards");
            toast.success(`🎴 ${flashcardsResult.flashcards.length} flashcards créées !`, {
              description: "Va dans Exam Lab pour réviser",
            });
          } else {
            toast.dismiss("flashcards");
            toast.info("Aucune flashcard générée pour cette image");
          }
        } catch (flashcardError) {
          console.error("Error generating flashcards:", flashcardError);
          toast.dismiss("flashcards");
          toast.error("Échec de la génération des flashcards");
        }
      }

      // Create a review task
      await supabase.from("tasks").insert({
        user_id: user.id,
        title: `Réviser: ${aiResult.aiSummary?.substring(0, 50) || "Nouvelle capture"}...`,
        priority_score: 60,
        energy_level: "medium",
        subject_id: currentSubject?.id || null,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      onNoteCreated?.();
    } catch (error: any) {
      console.error("Error processing image:", error);
      toast.dismiss("processing");
      toast.error("Échec du traitement de l'image");
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
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
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

      {/* Expanded options */}
      <div
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex gap-3 transition-all duration-300",
          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <button
          onClick={handleCameraCapture}
          disabled={isProcessing}
          className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-lg border border-white/40 shadow-elevated flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-6 h-6 text-primary" />
        </button>
        <button
          onClick={handleFileUpload}
          disabled={isProcessing}
          className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-lg border border-white/40 shadow-elevated flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
        >
          <Upload className="w-6 h-6 text-success" />
        </button>
        <button
          disabled
          className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-lg border border-white/40 shadow-elevated flex items-center justify-center opacity-50 cursor-not-allowed"
        >
          <Mic className="w-6 h-6 text-destructive" />
        </button>
      </div>

      {/* Main button */}
      <button
        onClick={() => !isProcessing && setIsExpanded(!isExpanded)}
        disabled={isProcessing}
        className={cn(
          "relative w-16 h-16 rounded-full shadow-elevated transition-all duration-300 flex items-center justify-center",
          "bg-gradient-to-br from-primary to-primary/80",
          "hover:scale-105 active:scale-95",
          "disabled:opacity-70",
          isExpanded && "rotate-45"
        )}
      >
        {isProcessing ? (
          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
        )}

        {/* Pulse effect */}
        {!isProcessing && !isExpanded && (
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        )}
      </button>

      {/* Context label */}
      {currentSubject && !isExpanded && !isProcessing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-soft text-foreground">
            Will tag as {currentSubject.icon} {currentSubject.name}
          </span>
        </div>
      )}
    </div>
  );
};
