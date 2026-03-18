import { useState } from "react";
import { GlassCard } from "./GlassCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ChevronRight, Sparkles, BookOpen, Calendar, Loader2, Link2, ArrowLeft, QrCode } from "lucide-react";
import { GroupSelector } from "./GroupSelector";
import { QRCodeScanner } from "./QRCodeScanner";

const SUBJECT_PRESETS = [
  { name: "Mathématiques", icon: "📐", colorKey: "math" },
  { name: "Histoire", icon: "📜", colorKey: "history" },
  { name: "Physique", icon: "⚡", colorKey: "physique" },
  { name: "Anglais", icon: "📚", colorKey: "english" },
  { name: "Chimie", icon: "🧪", colorKey: "Chimie" },
  { name: "Biologie", icon: "🧬", colorKey: "Bio" },
  { name: "Géographie", icon: "🌍", colorKey: "Geo" },
  { name: "Art", icon: "🎨", colorKey: "Art" },
];

interface SetupWizardProps {
  onComplete: () => void;
}

type SetupStep = "url" | "group" | "manual";

export const SetupWizard = ({ onComplete }: SetupWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<SetupStep>("url");
  const [icalUrl, setIcalUrl] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<typeof SUBJECT_PRESETS>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const isValidCalendarUrl = (url: string): boolean => {
    const lowered = url.toLowerCase();
    return (
      lowered.includes(".ics") ||
      lowered.includes("ical") ||
      lowered.includes("vcal") ||
      lowered.includes("calendar") ||
      lowered.includes("planning") ||
      lowered.includes("webcal://") ||
      lowered.includes("hyperplanning") ||
      lowered.includes("celcat") ||
      lowered.includes("ade") ||
      (lowered.startsWith("http") && (lowered.includes("export") || lowered.includes("subscribe")))
    );
  };

  const normalizeCalendarUrl = (url: string): string => {
    // Convert webcal:// to https://
    if (url.startsWith("webcal://")) {
      return url.replace("webcal://", "https://");
    }
    return url;
  };

  const handleQRScan = (scannedUrl: string) => {
    const normalizedUrl = normalizeCalendarUrl(scannedUrl);
    setIcalUrl(normalizedUrl);
    setShowQRScanner(false);
    toast.success("URL ajoutée !", {
      description: "Clique sur Continuer pour synchroniser",
    });
  };

  const toggleSubject = (subject: (typeof SUBJECT_PRESETS)[0]) => {
    setSelectedSubjects((prev) => {
      const exists = prev.some((s) => s.name === subject.name);
      if (exists) {
        return prev.filter((s) => s.name !== subject.name);
      }
      if (prev.length >= 5) {
        toast.info("Maximum 5 matières pour le moment");
        return prev;
      }
      return [...prev, subject];
    });
  };

  const handleUrlSubmit = async () => {
    if (!user || !icalUrl) return;

    // Normalize the URL first
    const normalizedUrl = normalizeCalendarUrl(icalUrl.trim());
    setIcalUrl(normalizedUrl);

    // Basic URL validation for iCal and vCal formats
    if (!isValidCalendarUrl(normalizedUrl)) {
      toast.error("URL de calendrier non reconnue", {
        description: "Formats supportés: iCal (.ics), vCal, Hyperplanning, CELCAT, ADE",
      });
      return;
    }

    // Save the URL first
    await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        ical_url: icalUrl,
      },
      { onConflict: "user_id" },
    );

    // Move to group selection step
    setStep("group");
  };

  const handleGroupSelected = async (group: string) => {
    if (!user) return;

    setSyncing(true);
    try {
      // Trigger sync with the selected group
      const { data, error } = await supabase.functions.invoke("sync-calendar", {
        body: { userId: user.id, icalUrl, filterGroup: group },
      });

      if (error) throw error;

      const result = data.results?.[0];
      if (result?.success) {
        toast.success(`${result.eventsSynced} cours importés !`, {
          description: `${result.newSubjects} matières découvertes • Filtre: ${group}`,
        });

        // Create welcome tasks
        await supabase.from("tasks").insert([
          {
            user_id: user.id,
            title: "Bienvenue sur Orbit ! Ton emploi du temps est synchronisé ✨",
            priority_score: 90,
            energy_level: "low",
            due_date: new Date().toISOString(),
          },
        ]);

        onComplete();
      } else {
        throw new Error(result?.error || "Sync failed");
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error("Échec de la synchronisation", {
        description: "Essaye la configuration manuelle",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSkipGroupFilter = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      // Sync without group filter
      const { data, error } = await supabase.functions.invoke("sync-calendar", {
        body: { userId: user.id, icalUrl },
      });

      if (error) throw error;

      const result = data.results?.[0];
      if (result?.success) {
        toast.success(`${result.eventsSynced} cours importés !`, {
          description: `${result.newSubjects} matières découvertes`,
        });

        await supabase.from("tasks").insert([
          {
            user_id: user.id,
            title: "Bienvenue sur Orbit ! Ton emploi du temps est synchronisé ✨",
            priority_score: 90,
            energy_level: "low",
            due_date: new Date().toISOString(),
          },
        ]);

        onComplete();
      } else {
        throw new Error(result?.error || "Sync failed");
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error("Échec de la synchronisation");
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSetup = async () => {
    if (!user || selectedSubjects.length === 0) return;

    setLoading(true);
    try {
      // Create subjects
      const subjectPromises = selectedSubjects.map(async (s) => {
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            user_id: user.id,
            name: s.name,
            icon: s.icon,
            color_key: s.colorKey,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      const createdSubjects = await Promise.all(subjectPromises);

      // Create sample schedule (Monday classes)
      const schedulePromises = createdSubjects.map(async (subject, index) => {
        const startHour = 9 + index;
        const eventDate = new Date();
        // Set to next Monday + index days offset
        const dayOffset = (1 - eventDate.getDay() + 7) % 7;
        eventDate.setDate(eventDate.getDate() + dayOffset);
        const eventDateStr = eventDate.toISOString().split('T')[0];
        
        const { error } = await supabase.from("calendar_events").insert({
          user_id: user.id,
          title: subject.name,
          subject_id: subject.id,
          start_time: `${startHour.toString().padStart(2, "0")}:00`,
          end_time: `${(startHour + 1).toString().padStart(2, "0")}:00`,
          day_of_week: 1,
          event_date: eventDateStr,
          event_type: "class",
        });

        if (error) throw error;
      });

      await Promise.all(schedulePromises);

      // Create a sample exam
      if (createdSubjects[0]) {
        const examDate = new Date();
        examDate.setDate(examDate.getDate() + 7);

        await supabase.from("calendar_events").insert({
          user_id: user.id,
          title: `${createdSubjects[0].name} Exam`,
          subject_id: createdSubjects[0].id,
          start_time: "09:00",
          end_time: "11:00",
          day_of_week: 5,
          event_type: "exam",
          exam_date: examDate.toISOString().split("T")[0],
        });
      }

      // Create welcome tasks
      await supabase.from("tasks").insert([
        {
          user_id: user.id,
          title: "Bienvenue sur Orbit ! Tape + pour capturer des notes",
          priority_score: 90,
          energy_level: "low",
          due_date: new Date().toISOString(),
        },
        {
          user_id: user.id,
          title: "Essaye de décomposer une tâche avec le bouton ✨",
          priority_score: 70,
          energy_level: "medium",
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      toast.success("Configuration terminée ! Bienvenue sur Orbit 🚀");
      onComplete();
    } catch (error: any) {
      console.error("Setup error:", error);
      toast.error("Échec de la configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in py-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {step === "url" && "Connecte ton Emploi du Temps"}
          {step === "group" && "Sélectionne ton Groupe"}
          {step === "manual" && "Choisis tes Matières"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {step === "url" && "Colle l'URL iCal de ton école pour une synchronisation automatique"}
          {step === "group" && "On a détecté plusieurs groupes, choisis le tien"}
          {step === "manual" && "Configure manuellement tes matières"}
        </p>
      </div>

      {step === "url" && (
        <>
          {/* iCal URL Input */}
          <GlassCard variant="elevated" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold">URL du Calendrier</h2>
              </div>

              {/* QR Code Scanner Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQRScanner(true)}
                className="flex items-center gap-1.5 text-primary hover:bg-primary/10"
              >
                <QrCode className="w-4 h-4" />
                <span className="text-sm">Scanner QR</span>
              </Button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://hplanning.univ.fr/ical/..."
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                  className="pl-10 h-12 bg-white/50 border-white/30 rounded-xl"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                💡 Formats supportés: iCal (.ics), vCal, Hyperplanning, CELCAT, ADE, webcal://
              </p>
            </div>
          </GlassCard>

          {/* Continue Button */}
          <Button
            onClick={handleUrlSubmit}
            disabled={!icalUrl}
            className="w-full h-14 rounded-xl gradient-primary text-white font-medium text-lg"
          >
            Continuer
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Or divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Manual Setup */}
          <Button variant="outline" onClick={() => setStep("manual")} className="w-full h-12 rounded-xl">
            Configuration Manuelle
          </Button>

          {/* QR Scanner Modal */}
          {showQRScanner && <QRCodeScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
        </>
      )}

      {step === "group" && (
        <>
          {syncing ? (
            <GlassCard variant="elevated" className="p-6">
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-display font-semibold text-foreground">Synchronisation en cours...</p>
                  <p className="text-sm text-muted-foreground mt-1">Import et nettoyage de ton emploi du temps</p>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GroupSelector icalUrl={icalUrl} onGroupSelected={handleGroupSelected} onSkip={handleSkipGroupFilter} />
          )}

          {/* Back button */}
          <Button variant="ghost" onClick={() => setStep("url")} disabled={syncing} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </>
      )}

      {step === "manual" && (
        <>
          {/* Subject Selection */}
          <GlassCard variant="elevated" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold">Tes Matières</h2>
              <span className="text-sm text-muted-foreground ml-auto">{selectedSubjects.length}/5 sélectionnées</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SUBJECT_PRESETS.map((subject) => {
                const isSelected = selectedSubjects.some((s) => s.name === subject.name);
                return (
                  <button
                    key={subject.name}
                    onClick={() => toggleSubject(subject)}
                    className={`
                      p-3 rounded-xl border-2 transition-all text-left
                      ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-white/30 bg-white/50 hover:border-primary/50"
                      }
                    `}
                  >
                    <span className="text-2xl">{subject.icon}</span>
                    <p className="font-medium mt-1 text-sm">{subject.name}</p>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Continue button */}
          <Button
            onClick={handleManualSetup}
            disabled={selectedSubjects.length === 0 || loading}
            className="w-full h-14 rounded-xl gradient-primary text-white font-medium text-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Commencer
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {/* Back button */}
          <Button variant="ghost" onClick={() => setStep("url")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'import automatique
          </Button>
        </>
      )}
    </div>
  );
};
