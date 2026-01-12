import { useState, useRef } from "react";
import { Camera, Plus, X, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useVaultData, VaultFile } from "@/hooks/useVaultData";
import { toast } from "sonner";

interface SmartVaultCaptureProps {
  onFileCaptured?: (file: VaultFile, aiResult: any) => void;
}

export const SmartVaultCapture = ({ onFileCaptured }: SmartVaultCaptureProps) => {
  const { user } = useAuth();
  const { subjects, events, getCurrentClass } = useOrbitData();
  const { createFile } = useVaultData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    if (!user) {
      toast.error("Connecte-toi pour capturer des fichiers");
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

      toast.loading("🧠 Analyse IA en cours...", { id: "processing" });

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("notes")
        .getPublicUrl(fileName);

      // Get context for smart filing
      const currentClass = getCurrentClass();
      const today = new Date().getDay();
      const todayClasses = events.filter(e => e.day_of_week === today && e.event_type === 'class');

      // Process with AI for smart filing
      const { data: aiResult, error: aiError } = await supabase.functions.invoke("smart-file", {
        body: { 
          imageBase64: base64, 
          userId: user.id,
          currentClassId: currentClass?.id || null,
          todayClasses: todayClasses,
          subjects: subjects.map(s => ({
            id: s.id,
            name: s.name,
            ical_code: (s as any).ical_code || null,
            icon: s.icon,
          })),
        },
      });

      if (aiError) throw aiError;

      // Determine suggested subject
      let suggestedSubjectId = aiResult.matchedSubjectId || null;
      let suggestedSubjectName = aiResult.matchedSubjectName || aiResult.detectedSubject?.name || null;
      let suggestedSubjectIcon = aiResult.matchedSubjectIcon || null;
      let confidence = aiResult.matchConfidence || aiResult.detectedSubject?.confidence || 0;

      // Apply context boost if available
      if (aiResult.contextBoost) {
        suggestedSubjectId = aiResult.contextBoost.boostedSubjectId;
        suggestedSubjectName = aiResult.contextBoost.boostedSubjectName;
        suggestedSubjectIcon = aiResult.contextBoost.boostedSubjectIcon;
        confidence = aiResult.contextBoost.boostedConfidence;
      }

      // Create vault file
      const newFile = await createFile({
        file_url: publicUrl,
        extracted_text: aiResult.rawText || null,
        ai_summary: aiResult.aiSummary || null,
        tags: aiResult.suggestedTags || [],
        ai_detected_subject: suggestedSubjectName,
        ai_confidence: confidence,
        filing_status: 'pending',
        original_filename: file.name,
        file_type: file.type.startsWith('image/') ? 'image' : 'document',
        subject_id: null, // Will be set when user confirms
      });

      toast.dismiss("processing");

      if (newFile) {
        // Notify parent with AI result for confirmation banner
        onFileCaptured?.(newFile, {
          suggestedSubjectId,
          suggestedSubjectName,
          suggestedSubjectIcon,
          confidence,
          reasoning: aiResult.detectedSubject?.reasoning || null,
        });

        toast.success("📸 Document capturé !", {
          description: suggestedSubjectName 
            ? `IA suggère: ${suggestedSubjectIcon} ${suggestedSubjectName}`
            : "Confirme le classement",
        });
      }

    } catch (error: any) {
      console.error("Error processing image:", error);
      toast.dismiss("processing");
      toast.error("Échec du traitement");
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

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
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
        accept="image/*,application/pdf"
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
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          className="w-14 h-14 rounded-2xl bg-card backdrop-blur-lg border border-border shadow-elevated flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-6 h-6 text-primary" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-14 h-14 rounded-2xl bg-card backdrop-blur-lg border border-border shadow-elevated flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
        >
          <Upload className="w-6 h-6 text-success" />
        </button>
      </div>

      {/* Main button */}
      <button
        onClick={() => !isProcessing && setIsExpanded(!isExpanded)}
        disabled={isProcessing}
        className={cn(
          "relative w-16 h-16 rounded-full shadow-elevated transition-all duration-300 flex items-center justify-center",
          "gradient-primary",
          "hover:scale-105 active:scale-95",
          "disabled:opacity-70",
          isExpanded && "rotate-45"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
        )}

        {/* Pulse effect */}
        {!isProcessing && !isExpanded && (
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        )}
      </button>
    </div>
  );
};
