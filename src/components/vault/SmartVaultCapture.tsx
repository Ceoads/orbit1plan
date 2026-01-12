import { useState, useRef, useEffect } from "react";
import { Camera, Plus, Upload, Loader2, MapPin, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrbitData } from "@/hooks/useOrbitData";
import { useVaultData, VaultFile } from "@/hooks/useVaultData";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

interface SmartVaultCaptureProps {
  onFileCaptured?: (file: VaultFile, aiResult: any) => void;
}

export const SmartVaultCapture = ({ onFileCaptured }: SmartVaultCaptureProps) => {
  const { user } = useAuth();
  const { subjects, events, getCurrentClass } = useOrbitData();
  const { createFile } = useVaultData();
  const { 
    getCurrentPosition, 
    hasCampusConfigured, 
    campusName,
    getContextMode,
    latitude,
    longitude,
    isOnCampus,
  } = useGeolocation();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contextMode, setContextMode] = useState<'campus' | 'home' | 'unknown'>('unknown');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Update context mode when component mounts or geolocation changes
  useEffect(() => {
    const updateContextMode = async () => {
      if (hasCampusConfigured) {
        await getCurrentPosition();
        setContextMode(getContextMode());
      }
    };
    updateContextMode();
  }, [hasCampusConfigured]);

  // Get today's class history for work-from-home mode
  const getTodayClassHistory = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Get all classes from today
    const todayClasses = events
      .filter(e => e.day_of_week === currentDay && e.event_type === 'class')
      .map(e => {
        const [startH, startM] = e.start_time.split(':').map(Number);
        const [endH, endM] = e.end_time.split(':').map(Number);
        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;
        
        return {
          ...e,
          startMinutes: startTime,
          endMinutes: endTime,
          isPast: endTime < currentTime,
          isCurrent: startTime <= currentTime && endTime >= currentTime,
          isFuture: startTime > currentTime,
        };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // For work-from-home mode, get the most recent past class
    const pastClasses = todayClasses.filter(c => c.isPast);
    const mostRecentClass = pastClasses.length > 0 ? pastClasses[pastClasses.length - 1] : null;

    return {
      allClasses: todayClasses,
      pastClasses,
      currentClass: todayClasses.find(c => c.isCurrent) || null,
      mostRecentClass,
      futureClasses: todayClasses.filter(c => c.isFuture),
    };
  };

  const processImage = async (file: File) => {
    if (!user) {
      toast.error("Connecte-toi pour capturer des fichiers");
      return;
    }

    setIsProcessing(true);
    setIsExpanded(false);

    try {
      // Get fresh geolocation
      const geoResult = await getCurrentPosition();
      const currentContextMode = getContextMode();
      setContextMode(currentContextMode);

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
      const classHistory = getTodayClassHistory();
      const currentClass = getCurrentClass();
      const today = new Date().getDay();
      const todayClasses = events.filter(e => e.day_of_week === today && e.event_type === 'class');

      // Prepare context data for AI
      const contextData = {
        mode: currentContextMode,
        isOnCampus: geoResult.isOnCampus,
        distanceFromCampus: geoResult.distanceFromCampus,
        campusName: campusName,
        mostRecentClass: classHistory.mostRecentClass ? {
          title: classHistory.mostRecentClass.title,
          subject_id: classHistory.mostRecentClass.subject_id,
          endTime: classHistory.mostRecentClass.end_time,
        } : null,
        todayClassHistory: classHistory.pastClasses.map(c => ({
          title: c.title,
          subject_id: c.subject_id,
          time: `${c.start_time}-${c.end_time}`,
        })),
      };

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
          geolocation: {
            latitude: geoResult.latitude,
            longitude: geoResult.longitude,
            isOnCampus: geoResult.isOnCampus,
            distanceFromCampus: geoResult.distanceFromCampus,
          },
          contextMode: currentContextMode,
          classHistory: contextData,
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

      // Apply work-from-home fallback if needed
      if (aiResult.workFromHomeSuggestion) {
        suggestedSubjectId = aiResult.workFromHomeSuggestion.subjectId;
        suggestedSubjectName = aiResult.workFromHomeSuggestion.subjectName;
        suggestedSubjectIcon = aiResult.workFromHomeSuggestion.subjectIcon;
        confidence = aiResult.workFromHomeSuggestion.confidence;
      }

      // Create vault file with geolocation
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
        subject_id: null,
      });

      // Update file with geolocation data
      if (newFile && (geoResult.latitude || geoResult.longitude)) {
        await supabase
          .from('vault_files')
          .update({
            capture_latitude: geoResult.latitude,
            capture_longitude: geoResult.longitude,
            was_on_campus: geoResult.isOnCampus,
          })
          .eq('id', newFile.id);
      }

      toast.dismiss("processing");

      if (newFile) {
        // Notify parent with AI result for confirmation banner
        onFileCaptured?.(newFile, {
          suggestedSubjectId,
          suggestedSubjectName,
          suggestedSubjectIcon,
          confidence,
          reasoning: aiResult.detectedSubject?.reasoning || aiResult.workFromHomeReasoning || null,
          contextMode: currentContextMode,
          isOnCampus: geoResult.isOnCampus,
        });

        const locationContext = geoResult.isOnCampus 
          ? `📍 Sur le campus` 
          : currentContextMode === 'home' 
            ? `🏠 Mode travail à domicile`
            : '';

        toast.success("📸 Document capturé !", {
          description: suggestedSubjectName 
            ? `IA suggère: ${suggestedSubjectIcon} ${suggestedSubjectName} ${locationContext}`
            : `Confirme le classement ${locationContext}`,
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

      {/* Context indicator */}
      {hasCampusConfigured && !isExpanded && !isProcessing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className={cn(
            "text-xs font-medium px-3 py-1 rounded-full shadow-soft flex items-center gap-1.5",
            isOnCampus 
              ? "bg-success/20 text-success border border-success/30" 
              : "bg-muted/80 text-muted-foreground border border-border"
          )}>
            {isOnCampus ? (
              <>
                <MapPin className="w-3 h-3" />
                Sur le campus
              </>
            ) : (
              <>
                <Home className="w-3 h-3" />
                Mode maison
              </>
            )}
          </span>
        </div>
      )}

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
