/**
 * Phase 2: Interactive Tutorial - "Le Parcours du Pilote"
 * Guides users through key app features with spotlight effects
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { SpotlightOverlay } from "./SpotlightOverlay";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, X } from "lucide-react";
import Confetti from "./Confetti";

export type TutorialStep = 
  | "welcome"
  | "add-subject" 
  | "explore-lab" 
  | "check-pulse"
  | "complete";

interface TutorialMission {
  id: TutorialStep;
  targetSelector?: string;
  message: string;
  subtitle: string;
  tooltipPosition: "top" | "bottom" | "left" | "right";
  requiresAction?: boolean;
}

const missions: TutorialMission[] = [
  {
    id: "welcome",
    message: "🚀 Bienvenue dans Orbit !",
    subtitle: "Suis ce guide rapide pour maîtriser ton nouvel outil.",
    tooltipPosition: "bottom",
  },
  {
    id: "add-subject",
    targetSelector: "[data-tutorial='add-button']",
    message: "Ajoute une matière",
    subtitle: "Tape sur le bouton + pour créer ta première matière manuellement.",
    tooltipPosition: "top",
    requiresAction: true,
  },
  {
    id: "explore-lab",
    targetSelector: "[data-tutorial='lab-tab']",
    message: "Découvre le Lab",
    subtitle: "Génère des Flashcards et des résumés avec l'IA.",
    tooltipPosition: "top",
    requiresAction: true,
  },
  {
    id: "check-pulse",
    targetSelector: "[data-tutorial='pulse-tab']",
    message: "Retour à Pulse",
    subtitle: "Ton tableau de bord centralisé. Tout commence ici !",
    tooltipPosition: "top",
    requiresAction: true,
  },
  {
    id: "complete",
    message: "🎉 Tu maîtrises Orbit !",
    subtitle: "Tu es prêt à révolutionner ton organisation scolaire.",
    tooltipPosition: "bottom",
  },
];

interface InteractiveTutorialProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentStep: TutorialStep;
  onStepChange: (step: TutorialStep) => void;
}

export const InteractiveTutorial = ({
  isActive,
  onComplete,
  onSkip,
  currentStep,
  onStepChange,
}: InteractiveTutorialProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const haptics = useHaptics();
  const sounds = useSoundEffects();

  const currentMission = missions.find(m => m.id === currentStep);
  const currentIndex = missions.findIndex(m => m.id === currentStep);

  // Find and track target element position
  const updateTargetPosition = useCallback(() => {
    if (!currentMission?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(currentMission.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentMission?.targetSelector]);

  useEffect(() => {
    if (!isActive) return;

    updateTargetPosition();
    
    // Update on scroll/resize
    const handleUpdate = () => updateTargetPosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    
    // Periodic update for dynamic elements
    const interval = setInterval(handleUpdate, 500);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
      clearInterval(interval);
    };
  }, [isActive, updateTargetPosition]);

  const advanceToNextStep = () => {
    haptics.success();
    sounds.success();

    const nextIndex = currentIndex + 1;
    if (nextIndex < missions.length) {
      onStepChange(missions[nextIndex].id);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setShowConfetti(true);
    haptics.success();
    sounds.success();

    // Animate completion and close
    setTimeout(() => {
      setShowConfetti(false);
      onComplete();
    }, 2500);
  };

  const handleSkip = () => {
    haptics.selection();
    sounds.tap();
    onSkip();
  };

  if (!isActive || !currentMission) return null;

  const isWelcomeOrComplete = currentStep === "welcome" || currentStep === "complete";

  return (
    <>
      <AnimatePresence>
        <SpotlightOverlay
          isVisible={true}
          targetRect={targetRect}
          message={currentMission.message}
          subtitle={currentMission.subtitle}
          tooltipPosition={currentMission.tooltipPosition}
        >
          {/* Progress indicator */}
          <div className="flex items-center gap-1 mb-3">
            {missions.slice(0, -1).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-full">
            {isWelcomeOrComplete ? (
              <Button
                onClick={currentStep === "complete" ? handleComplete : advanceToNextStep}
                className="flex-1 rounded-xl gradient-primary text-white"
                size="sm"
              >
                {currentStep === "complete" ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Terminer
                  </>
                ) : (
                  <>
                    C'est parti !
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Passer
                </Button>
                {!currentMission.requiresAction && (
                  <Button
                    onClick={advanceToNextStep}
                    size="sm"
                    className="rounded-xl gradient-primary text-white"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </>
            )}
          </div>
        </SpotlightOverlay>
      </AnimatePresence>

      {/* Confetti on completion */}
      {showConfetti && <Confetti />}
    </>
  );
};

// Hook to manage tutorial state
export const useTutorial = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep>("welcome");

  const startTutorial = () => {
    setCurrentStep("welcome");
    setIsActive(true);
  };

  const completeTutorial = () => {
    setIsActive(false);
    setCurrentStep("welcome");
    localStorage.setItem("orbit_tutorial_completed", "true");
  };

  const skipTutorial = () => {
    setIsActive(false);
    localStorage.setItem("orbit_tutorial_completed", "true");
  };

  const advanceStep = (step: TutorialStep) => {
    setCurrentStep(step);
  };

  // Check if tutorial was completed
  const hasCompletedTutorial = () => {
    return localStorage.getItem("orbit_tutorial_completed") === "true";
  };

  return {
    isActive,
    currentStep,
    startTutorial,
    completeTutorial,
    skipTutorial,
    advanceStep,
    hasCompletedTutorial,
  };
};
