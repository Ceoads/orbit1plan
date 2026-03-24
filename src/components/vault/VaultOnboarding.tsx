import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CleanedSubject {
  cleanName: string;
  isSAE: boolean;
  originalCodes: string[];
  selected: boolean;
}

interface VaultOnboardingProps {
  onComplete: () => void;
}

const COURS_COLORS = ["math", "history", "physics", "english", "chemistry", "geometry"];
const SAE_COLOR = "english"; // purple-ish

export const VaultOnboarding = ({ onComplete }: VaultOnboardingProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"loading" | "validating" | "saving">("loading");
  const [subjects, setSubjects] = useState<CleanedSubject[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) extractAndClean();
  }, [user]);

  const extractAndClean = async () => {
    try {
      setStep("loading");
      setError(null);

      const { data: events, error: eventsError } = await supabase
        .from("calendar_events")
        .select("title")
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        setError("Aucun cours trouvé dans ton emploi du temps. Synchronise d'abord ton calendrier iCal dans les paramètres.");
        setStep("validating");
        return;
      }

      const rawTitles = [...new Set(events.map((e) => e.title))];

      const { data, error: fnError } = await supabase.functions.invoke("clean-subjects", {
        body: { rawSubjects: rawTitles },
      });

      if (fnError) throw fnError;

      const cleaned: CleanedSubject[] = (data?.subjects || []).map(
        (s: any) => ({ ...s, selected: true })
      );

      setSubjects(cleaned);
      setStep("validating");
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError("Erreur lors de l'analyse. Ajoute tes matières manuellement.");
      setStep("validating");
    }
  };

  const toggleSubject = (index: number) => {
    setSubjects((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const addManualSubject = () => {
    const name = manualInput.trim();
    if (!name) return;
    if (subjects.some((s) => s.cleanName.toLowerCase() === name.toLowerCase())) {
      toast.error("Cette matière existe déjà");
      return;
    }
    setSubjects((prev) => [
      ...prev,
      { cleanName: name, isSAE: false, originalCodes: [], selected: true },
    ]);
    setManualInput("");
  };

  const handleValidate = async () => {
    if (!user) return;
    const selected = subjects.filter((s) => s.selected);
    if (selected.length === 0) {
      toast.error("Sélectionne au moins une matière");
      return;
    }

    setStep("saving");

    try {
      // Delete old vault files for fresh start
      await supabase.from("vault_files").delete().eq("user_id", user.id);

      // Insert subjects one by one to avoid unique constraint issues
      let coursColorIndex = 0;
      for (const s of selected) {
        const colorKey = s.isSAE ? SAE_COLOR : COURS_COLORS[coursColorIndex++ % COURS_COLORS.length];
        
        // Check if subject already exists
        const { data: existing } = await supabase
          .from("subjects")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", s.cleanName)
          .maybeSingle();

        if (!existing) {
          const { error: insertError } = await supabase
            .from("subjects")
            .insert({
              user_id: user.id,
              name: s.cleanName,
              color_key: colorKey,
              icon: s.isSAE ? "SAE" : "COURS",
              ical_code: s.originalCodes.join(",") || null,
            });
          if (insertError) {
            console.error("Insert error for", s.cleanName, insertError);
          }
        }
      }

      // Mark vault as initialized
      await supabase
        .from("profiles")
        .update({ preferences: { vault_initialized: true } })
        .eq("user_id", user.id);

      toast.success("Vault configuré !");
      onComplete();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Erreur lors de la sauvegarde");
      setStep("validating");
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Analyse de ton emploi du temps
          </p>
          <p className="text-xs text-muted-foreground">
            Extraction et nettoyage des matières...
          </p>
        </div>
      </div>
    );
  }

  if (step === "saving") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Configuration du Vault...</p>
      </div>
    );
  }

  const selectedCount = subjects.filter((s) => s.selected).length;
  const coursSubjects = subjects.filter((s) => !s.isSAE);
  const saeSubjects = subjects.filter((s) => s.isSAE);

  // Color mapping for visual accent bars
  const colorMap: Record<string, string> = {
    math: "hsl(var(--math))",
    history: "hsl(var(--history))",
    physics: "hsl(var(--physics))",
    english: "hsl(var(--english))",
    chemistry: "hsl(var(--chemistry))",
    geometry: "hsl(var(--geometry))",
  };

  return (
    <div className="space-y-8 px-1 pb-32 animate-fade-in">
      {/* Header */}
      <div className="space-y-2 pt-4">
        <h1 className="font-display text-xl font-bold text-foreground">
          Configure ton Vault
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {error || "Matières extraites de ton emploi du temps. Coche celles que tu veux garder."}
        </p>
      </div>

      {/* COURS Section */}
      {coursSubjects.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Cours
          </p>
          <div className="space-y-2">
            {coursSubjects.map((subject, idx) => {
              const globalIdx = subjects.indexOf(subject);
              const colorKey = COURS_COLORS[idx % COURS_COLORS.length];
              const accentColor = colorMap[colorKey] || "hsl(var(--primary))";
              return (
                <button
                  key={globalIdx}
                  onClick={() => toggleSubject(globalIdx)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200",
                    "border",
                    subject.selected
                      ? "bg-card border-border shadow-soft"
                      : "bg-transparent border-transparent opacity-50"
                  )}
                >
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-sm font-medium text-foreground flex-1 text-left">
                    {subject.cleanName}
                  </span>
                  {subject.selected && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SAE Section */}
      {saeSubjects.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            SAE
          </p>
          <div className="space-y-2">
            {saeSubjects.map((subject) => {
              const globalIdx = subjects.indexOf(subject);
              return (
                <button
                  key={globalIdx}
                  onClick={() => toggleSubject(globalIdx)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200",
                    "border",
                    subject.selected
                      ? "bg-card border-border shadow-soft"
                      : "bg-transparent border-transparent opacity-50"
                  )}
                >
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorMap.english }}
                  />
                  <span className="text-sm font-medium text-foreground flex-1 text-left">
                    {subject.cleanName}
                  </span>
                  {subject.selected && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual add */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Ajouter manuellement
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addManualSubject()}
            placeholder="Nom de la matière..."
            maxLength={50}
            className="flex-1 px-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button
            onClick={addManualSubject}
            size="icon"
            variant="outline"
            className="rounded-2xl h-12 w-12"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Validate */}
      <Button
        onClick={handleValidate}
        disabled={selectedCount === 0}
        className="w-full h-14 rounded-2xl gradient-primary text-base font-semibold shadow-lg"
      >
        Valider {selectedCount > 0 ? `(${selectedCount} matière${selectedCount > 1 ? "s" : ""})` : ""}
      </Button>
    </div>
  );
};
