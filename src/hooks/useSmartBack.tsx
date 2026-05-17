import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";

/**
 * Returns a "smart back" function:
 * - Goes to the previous page in history when possible (true iOS Back behavior).
 * - Falls back to a sensible route if there's no history (deep link, refresh, etc.).
 *
 * Use this anywhere a "Retour" / back-chevron button is rendered so the user is
 * never sent back to the home page unexpectedly.
 */
export function useSmartBack(fallback: string = "/") {
  const navigate = useNavigate();
  const location = useLocation();
  const haptics = useHaptics();
  const sounds = useSoundEffects();

  return useCallback(() => {
    haptics.selection();
    sounds.tap();

    // window.history.length > 1 means there's at least one prior entry in this tab.
    // We also guard against bouncing back to /landing or /auth from inside the app.
    const hasHistory =
      typeof window !== "undefined" && window.history.length > 1;

    if (hasHistory) {
      navigate(-1);
      return;
    }

    // No history → go somewhere sensible instead of staying stuck.
    if (location.pathname === fallback) return;
    navigate(fallback, { replace: true });
  }, [navigate, location.pathname, fallback, haptics, sounds]);
}
