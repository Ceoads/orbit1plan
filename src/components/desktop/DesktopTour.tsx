import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TOUR = [
  { title: "Navigation latérale", desc: "Toutes tes sections sont ici : bibliothèque, matières, quiz, fiches, échéances et notes." },
  { title: "Orbit AI", desc: "Ton prof perso : pose-lui une question, demande un schéma ou parle-lui au micro." },
  { title: "Cours et documents", desc: "La Bibliothèque range tes documents par matière, automatiquement." },
  { title: "Calendrier et tâches", desc: "Ton emploi du temps, tes échéances et tes tâches du jour, synchronisés." },
  { title: "Intégrations", desc: "Connecte Google Drive et ton calendrier depuis la section Google Drive ou les réglages." },
];

/**
 * Small contextual tooltip tour shown once on the first dashboard visit
 * after signup. Dismissed/finished → profiles.preferences.desktop_tour_done,
 * never shown again automatically.
 */
export function DesktopTour() {
  const { user } = useAuth();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("preferences, onboarding_status").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const prefs = (data?.preferences as Record<string, unknown> | null) ?? {};
        if (prefs.desktop_tour_done !== true && data?.onboarding_status === "completed") setStep(0);
      });
  }, [user?.id]);

  const finish = async () => {
    setStep(null);
    if (!user?.id) return;
    const { data } = await supabase.from("profiles").select("preferences").eq("user_id", user.id).maybeSingle();
    const preferences = { ...((data?.preferences as Record<string, unknown> | null) ?? {}), desktop_tour_done: true };
    await supabase.from("profiles").update({ preferences }).eq("user_id", user.id);
  };

  if (step === null) return null;
  const t = TOUR[step];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-8 left-72 z-50 w-80 bg-card rounded-3xl shadow-[0_16px_50px_rgb(0,0,0,0.12)] p-6"
        role="dialog"
        aria-label={`Astuce ${step + 1} sur ${TOUR.length} : ${t.title}`}
      >
        <p className="text-xs text-muted-foreground mb-1">{step + 1} / {TOUR.length}</p>
        <p className="font-semibold">{t.title}</p>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{t.desc}</p>
        <div className="flex items-center gap-2 mt-5">
          <button onClick={() => (step === TOUR.length - 1 ? finish() : setStep(step + 1))}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
            {step === TOUR.length - 1 ? "Terminer" : "Suivant"}
          </button>
          <button onClick={finish} className="h-10 px-4 rounded-xl text-sm text-muted-foreground hover:bg-muted">
            Terminer
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
