/**
 * Orbit Genesis - Complete Onboarding Flow
 * Combines narrative introduction + interactive tutorial
 */

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingNarrative } from "./OnboardingNarrative";
import { InteractiveTutorial, useTutorial, TutorialStep } from "./InteractiveTutorial";

interface OrbitOnboardingProps {
  /** Whether to show the onboarding (first time user) */
  isFirstTime: boolean;
  /** Callback when onboarding is fully complete */
  onComplete: () => void;
  /** Callback to proceed to setup wizard */
  onProceedToSetup: () => void;
}

export type OnboardingPhase = "narrative" | "setup" | "tutorial" | "complete";

export const OrbitOnboarding = ({
  isFirstTime,
  onComplete,
  onProceedToSetup,
}: OrbitOnboardingProps) => {
  const [phase, setPhase] = useState<OnboardingPhase>(isFirstTime ? "narrative" : "complete");
  const tutorial = useTutorial();

  // Check localStorage for returning users
  useEffect(() => {
    const hasSeenNarrative = localStorage.getItem("orbit_onboarding_seen") === "true";
    const hasTutorialCompleted = tutorial.hasCompletedTutorial();

    if (!isFirstTime) {
      setPhase("complete");
      return;
    }

    if (hasSeenNarrative && hasTutorialCompleted) {
      setPhase("complete");
      onComplete();
    } else if (hasSeenNarrative) {
      setPhase("setup");
    }
  }, [isFirstTime, onComplete, tutorial]);

  const handleNarrativeComplete = () => {
    localStorage.setItem("orbit_onboarding_seen", "true");
    setPhase("setup");
    onProceedToSetup();
  };

  const handleNarrativeSkip = () => {
    localStorage.setItem("orbit_onboarding_seen", "true");
    setPhase("setup");
    onProceedToSetup();
  };

  const handleSetupComplete = () => {
    // Start tutorial after setup
    setPhase("tutorial");
    tutorial.startTutorial();
  };

  const handleTutorialComplete = () => {
    setPhase("complete");
    tutorial.completeTutorial();
    onComplete();
  };

  const handleTutorialSkip = () => {
    setPhase("complete");
    tutorial.skipTutorial();
    onComplete();
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {phase === "narrative" && (
          <OnboardingNarrative
            key="narrative"
            onComplete={handleNarrativeComplete}
            onSkip={handleNarrativeSkip}
          />
        )}
      </AnimatePresence>

      {/* Tutorial overlay - works alongside the main app */}
      <InteractiveTutorial
        isActive={phase === "tutorial" && tutorial.isActive}
        currentStep={tutorial.currentStep}
        onStepChange={tutorial.advanceStep}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    </>
  );
};

// Export hook for triggering tutorial from settings or help
export { useTutorial };
export type { TutorialStep };
