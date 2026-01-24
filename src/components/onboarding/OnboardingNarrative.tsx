/**
 * Phase 1: Onboarding Narrative - 4 animated welcome screens
 * Apple-style introduction to the Orbit experience
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Sparkles, Home, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingNarrativeProps {
  onComplete: () => void;
  onSkip: () => void;
}

const screens = [
  {
    id: 1,
    icon: Sparkles,
    title: "Ton temps, parfaitement orchestré",
    subtitle: "Bienvenue dans Orbit",
    description: "L'app qui transforme ton chaos scolaire en harmonie parfaite.",
    gradient: "from-primary/20 via-primary/10 to-transparent",
  },
  {
    id: 2,
    icon: Home,
    title: "Accède à ton univers d'un geste",
    subtitle: "Le Dock Flottant",
    description: "Navigation fluide entre Pulse, Vault, Tasks, Exams et Lab.",
    gradient: "from-accent/20 via-accent/10 to-transparent",
  },
  {
    id: 3,
    icon: Calendar,
    title: "Plonge dans tes détails",
    subtitle: "Le Pocket Space",
    description: "Ton calendrier s'ouvre en plein écran avec un simple tap.",
    gradient: "from-success/20 via-success/10 to-transparent",
  },
  {
    id: 4,
    icon: Zap,
    title: "Prêt à décoller ?",
    subtitle: "Configuration",
    description: "Connecte ton emploi du temps et laisse la magie opérer.",
    gradient: "from-warning/20 via-warning/10 to-transparent",
  },
];

export const OnboardingNarrative = ({ onComplete, onSkip }: OnboardingNarrativeProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const haptics = useHaptics();
  const sounds = useSoundEffects();

  const handleNext = () => {
    haptics.selection();
    sounds.tap();
    
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      haptics.success();
      sounds.success();
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      haptics.selection();
      setCurrentScreen(currentScreen - 1);
    }
  };

  const screen = screens[currentScreen];
  const Icon = screen.icon;
  const isLast = currentScreen === screens.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-primary/5 px-6"
    >
      {/* Skip Button */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onSkip}
        className="absolute top-safe right-4 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Passer
      </motion.button>

      {/* Progress Dots */}
      <div className="absolute top-safe mt-16 flex gap-2">
        {screens.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentScreen 
                ? "bg-primary w-6" 
                : index < currentScreen 
                  ? "bg-primary/50" 
                  : "bg-muted"
            }`}
            layoutId={`dot-${index}`}
          />
        ))}
      </div>

      {/* Screen Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.1 
            }}
            className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${screen.gradient} backdrop-blur-xl flex items-center justify-center mb-8 shadow-xl`}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <Icon className="w-14 h-14 text-primary" />
            </motion.div>
          </motion.div>

          {/* Subtitle Badge */}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-medium text-primary/80 bg-primary/10 px-3 py-1 rounded-full mb-4"
          >
            {screen.subtitle}
          </motion.span>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-2xl font-bold text-foreground mb-3"
          >
            {screen.title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground leading-relaxed"
          >
            {screen.description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-safe mb-12 flex flex-col items-center gap-4 w-full max-w-xs px-6"
      >
        <Button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl gradient-primary text-white font-medium text-lg shadow-lg"
        >
          <motion.span
            key={isLast ? "start" : "next"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isLast ? "Commencer la Configuration" : "Continuer"}
          </motion.span>
        </Button>

        {currentScreen > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handlePrevious}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Précédent
          </motion.button>
        )}
      </motion.div>

      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        />
      </div>
    </motion.div>
  );
};
