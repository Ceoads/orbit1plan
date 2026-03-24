import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CleanedSubject {
  cleanName: string;
  isSAE: boolean;
  originalCodes: string[];
  selected: boolean;
}

interface VaultOnboardingProps {
  onComplete: () => void;
}

const COURS_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];
const SAE_COLOR = "#6366F1";

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
        (s: any) => ({
          ...s,
          selected: true,
        })
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
      await supabase.from("vault_files").delete().eq("user_id", user.id);

      let coursColorIndex = 0;
      const subjectsToInsert = selected.map((s) => {
        const color = s.isSAE ? SAE_COLOR : COURS_COLORS[coursColorIndex++ % COURS_COLORS.length];
        return {
          user_id: user.id,
          name: s.cleanName,
          color_key: color,
          icon: s.isSAE ? "SAE" : "COURS",
          ical_code: s.originalCodes.join(",") || null,
        };
      });

      const { error: insertError } = await supabase
        .from("subjects")
        .upsert(subjectsToInsert, { onConflict: "user_id,name", ignoreDuplicates: true });

      if (insertError) throw insertError;

      await supabase
        .from("profiles")
        .update({
          preferences: { vault_initialized: true },
        })
        .eq("user_id", user.id);

      toast.success("Vault configuré");
      onComplete();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Erreur lors de la sauvegarde");
      setStep("validating");
    }
  };

  if (step === "loading") {
    return (
      <div className="vault-dark min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-neutral-200 tracking-wide">
            Analyse de ton emploi du temps
          </p>
          <p className="text-xs text-neutral-500">
            Extraction et nettoyage des matières...
          </p>
        </div>
      </div>
    );
  }

  if (step === "saving") {
    return (
      <div className="vault-dark min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-400">Configuration du Vault...</p>
      </div>
    );
  }

  const selectedCount = subjects.filter((s) => s.selected).length;
  const coursSubjects = subjects.filter((s) => !s.isSAE);
  const saeSubjects = subjects.filter((s) => s.isSAE);

  return (
    <div className="vault-dark space-y-8 px-1 pb-32 animate-fade-in">
      <div className="space-y-2 pt-4">
        <h1 className="text-lg font-semibold text-neutral-100 tracking-tight">
          Configure ton Vault
        </h1>
        <p className="text-xs text-neutral-500 leading-relaxed">
          {error
            ? error
            : "Matières extraites de ton emploi du temps. Coche celles que tu veux garder."}
        </p>
      </div>

      {coursSubjects.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.15em]">
            Cours
          </p>
          <div className="space-y-1">
            {coursSubjects.map((subject, idx) => {
              const globalIdx = subjects.indexOf(subject);
              const color = COURS_COLORS[idx % COURS_COLORS.length];
              return (
                <button
                  key={globalIdx}
                  onClick={() => toggleSubject(globalIdx)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    "border",
                    subject.selected
                      ? "border-neutral-700 bg-neutral-900"
                      : "border-transparent bg-transparent opacity-40"
                  )}
                >
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-neutral-200 flex-1 text-left">
                    {subject.cleanName}
                  </span>
                  {subject.selected && (
                    <Check className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {saeSubjects.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.15em]">
            SAE
          </p>
          <div className="space-y-1">
            {saeSubjects.map((subject) => {
              const globalIdx = subjects.indexOf(subject);
              return (
                <button
                  key={globalIdx}
                  onClick={() => toggleSubject(globalIdx)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    "border",
                    subject.selected
                      ? "border-neutral-700 bg-neutral-900"
                      : "border-transparent bg-transparent opacity-40"
                  )}
                >
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SAE_COLOR }}
                  />
                  <span className="text-sm text-neutral-200 flex-1 text-left">
                    {subject.cleanName}
                  </span>
                  {subject.selected && (
                    <Check className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.15em]">
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
            className="flex-1 px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
          />
          <button
            onClick={addManualSubject}
            className="px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        onClick={handleValidate}
        disabled={selectedCount === 0}
        className={cn(
          "w-full py-4 rounded-lg text-sm font-medium transition-all",
          selectedCount > 0
            ? "bg-neutral-100 text-neutral-900 hover:bg-white"
            : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
        )}
      >
        Valider {selectedCount > 0 ? `(${selectedCount} matière${selectedCount > 1 ? "s" : ""})` : ""}
      </button>
    </div>
  );
};
