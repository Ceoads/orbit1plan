import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "orbit-cookie-consent";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const choose = (value: "accepted" | "refused") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* stockage indisponible : on masque quand même */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-4 bottom-4 z-[10000] mx-auto max-w-lg rounded-3xl bg-card p-5 shadow-[0_12px_40px_rgb(0,0,0,0.12)] backdrop-blur-xl md:inset-x-auto md:right-6 md:bottom-6"
          role="dialog"
          aria-label="Consentement cookies"
        >
          <p className="text-sm font-semibold text-foreground">Respect de ta vie privée</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Orbit n'utilise que le stockage nécessaire au fonctionnement (connexion, préférences).
            Aucun traceur publicitaire. Tu peux accepter ou refuser les mesures d'audience
            anonymes. Détails dans notre{" "}
            <a href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
              politique de confidentialité
            </a>
            .
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => choose("refused")}
              className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
            >
              Refuser
            </button>
            <button
              onClick={() => choose("accepted")}
              className="flex-1 rounded-full gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Accepter
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
