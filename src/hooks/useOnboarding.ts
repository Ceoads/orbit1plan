import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type OnboardingStatus = "not_started" | "in_progress" | "completed" | "skipped";

interface OnboardingState {
  status: OnboardingStatus;
  step: number;
  loading: boolean;
}

/**
 * Desktop first-time onboarding state, persisted on public.profiles.
 * Existing accounts were marked `completed` by migration, so only genuinely
 * new users ever see the wizard.
 */
export function useOnboarding() {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({ status: "completed", step: 0, loading: true });

  useEffect(() => {
    if (!user?.id) { setState((s) => ({ ...s, loading: !user })); return; }
    let alive = true;
    supabase
      .from("profiles")
      .select("onboarding_status, onboarding_current_step")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setState({
          status: (data?.onboarding_status as OnboardingStatus) ?? "completed",
          step: data?.onboarding_current_step ?? 0,
          loading: false,
        });
      });
    return () => { alive = false; };
  }, [user?.id]);

  const patch = useCallback(async (fields: Record<string, unknown>) => {
    if (!user?.id) return;
    await supabase.from("profiles").update(fields).eq("user_id", user.id);
  }, [user?.id]);

  const setStep = useCallback(async (step: number) => {
    setState((s) => ({ ...s, step, status: "in_progress" }));
    await patch({ onboarding_status: "in_progress", onboarding_current_step: step });
  }, [patch]);

  const complete = useCallback(async () => {
    setState({ status: "completed", step: 0, loading: false });
    await patch({ onboarding_status: "completed", onboarding_completed_at: new Date().toISOString() });
  }, [patch]);

  const skip = useCallback(async () => {
    setState({ status: "skipped", step: 0, loading: false });
    await patch({ onboarding_status: "skipped", onboarding_skipped_at: new Date().toISOString() });
  }, [patch]);

  const resume = useCallback(() => {
    setState((s) => ({ ...s, status: "in_progress" }));
  }, []);

  return {
    ...state,
    /** Auto-show the wizard only for brand-new accounts. An interrupted
     *  onboarding (in_progress) goes straight to the dashboard with a
     *  discreet resume card instead — never imposed at each login. */
    shouldShow: !state.loading && state.status === "not_started",
    /** Interrupted onboarding → discreet resume card on the dashboard. */
    interrupted: !state.loading && state.status === "in_progress",
    setStep,
    complete,
    skip,
    resume,
  };
}
