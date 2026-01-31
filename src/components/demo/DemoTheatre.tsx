import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Bell, Sparkles, Brain, Calendar, Clock, MapPin, Camera, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DemoTheatreProps {
  isOpen: boolean;
  onClose: () => void;
}

// Demo phases timing (in seconds)
const PHASE_A_START = 0;
const PHASE_A_END = 3;
const PHASE_B_START = 3;
const PHASE_B_END = 5;
const PHASE_C_START = 5;
const PHASE_C_END = 9;
const PHASE_D_START = 9;
const PHASE_D_END = 13;
const SHOW_CTA = 14;

export const DemoTheatre = ({ isOpen, onClose }: DemoTheatreProps) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Current phase state
  const [phase, setPhase] = useState<'A' | 'B' | 'C' | 'D' | 'end'>('A');
  const [showNotification, setShowNotification] = useState(false);
  const [showPocketSpace, setShowPocketSpace] = useState(false);
  const [showCourseHub, setShowCourseHub] = useState(false);
  const [showAINotification, setShowAINotification] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  // Start animation when opened
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      setCurrentTime(0);
      resetStates();
    }
  }, [isOpen]);

  // Timer logic
  useEffect(() => {
    if (!isPlaying || !isOpen) return;

    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1;
        
        // Phase transitions
        if (next >= PHASE_A_START && next < PHASE_A_END) {
          setPhase('A');
          if (next >= 1 && next < 1.2) setShowNotification(true);
        } else if (next >= PHASE_B_START && next < PHASE_B_END) {
          setPhase('B');
          if (next >= 3.5) setShowPocketSpace(true);
        } else if (next >= PHASE_C_START && next < PHASE_C_END) {
          setPhase('C');
          if (next >= 7) setShowCourseHub(true);
        } else if (next >= PHASE_D_START && next < PHASE_D_END) {
          setPhase('D');
          if (next >= 10) setShowAINotification(true);
          if (next >= 11.5) setShowFlashcard(true);
        } else if (next >= SHOW_CTA) {
          setPhase('end');
          setShowCTA(true);
        }

        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, isOpen]);

  const resetStates = () => {
    setPhase('A');
    setShowNotification(false);
    setShowPocketSpace(false);
    setShowCourseHub(false);
    setShowAINotification(false);
    setShowFlashcard(false);
    setShowCTA(false);
  };

  const handleStartExperience = () => {
    onClose();
    navigate('/auth');
  };

  const handleReplay = () => {
    setCurrentTime(0);
    resetStates();
    setIsPlaying(true);
  };

  // Shake animation for haptic simulation
  const shakeAnimation = {
    x: [0, -2, 2, -2, 2, 0],
    transition: { duration: 0.3 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Blurred backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Demo Container */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* iPhone 15 Pro Frame */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-colors z-20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* iPhone 15 Pro Frame */}
              <motion.div 
                className="relative w-[280px] md:w-[320px]"
                animate={showAINotification ? shakeAnimation : {}}
              >
                {/* Titanium Frame */}
                <div className="relative rounded-[50px] bg-gradient-to-b from-[#8E8E93] via-[#D1D1D6] to-[#8E8E93] p-[3px] shadow-2xl">
                  {/* Inner Black Bezel */}
                  <div className="rounded-[47px] bg-black p-[10px]">
                    {/* Screen Container */}
                    <div className="relative rounded-[38px] overflow-hidden bg-gradient-to-br from-[#FFF5ED] to-[#FFE4D6] aspect-[9/19.5]">
                      {/* Dynamic Island */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-30" />
                      
                      {/* Screen Content */}
                      <div className="relative h-full pt-12 pb-8 px-4 overflow-hidden">
                        <AnimatePresence mode="wait">
                          {/* Phase A: Pulse Dashboard */}
                          {(phase === 'A' || (phase === 'B' && !showPocketSpace)) && (
                            <motion.div
                              key="pulse"
                              className="h-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                            >
                              <PulseDashboard 
                                showNotification={showNotification} 
                                expandWidget={phase === 'B'}
                              />
                            </motion.div>
                          )}

                          {/* Phase B: Pocket Space (Calendar) */}
                          {showPocketSpace && !showCourseHub && (
                            <motion.div
                              key="pocketspace"
                              layoutId="schedule-widget"
                              className="h-full"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            >
                              <PocketSpaceView showCursor={phase === 'C' && !showCourseHub} />
                            </motion.div>
                          )}

                          {/* Phase C: Course Hub */}
                          {showCourseHub && phase !== 'D' && (
                            <motion.div
                              key="coursehub"
                              className="h-full"
                              initial={{ opacity: 0, scale: 0.8, y: 50 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, y: 50 }}
                              transition={{ type: "spring", damping: 20, stiffness: 200 }}
                            >
                              <CourseHubView />
                            </motion.div>
                          )}

                          {/* Phase D: AI Lab Magic */}
                          {phase === 'D' && (
                            <motion.div
                              key="ailab"
                              className="h-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <AILabView 
                                showNotification={showAINotification}
                                showFlashcard={showFlashcard}
                              />
                            </motion.div>
                          )}

                          {/* End State */}
                          {phase === 'end' && (
                            <motion.div
                              key="end"
                              className="h-full flex flex-col items-center justify-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles className="w-12 h-12 text-primary" />
                              </motion.div>
                              <p className="text-gray-900 font-semibold mt-4 text-center">
                                Orbit t'attend
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/30 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Side Buttons (decorative) */}
                <div className="absolute left-[-3px] top-28 w-[3px] h-8 bg-gradient-to-b from-[#8E8E93] to-[#D1D1D6] rounded-l-full" />
                <div className="absolute left-[-3px] top-40 w-[3px] h-14 bg-gradient-to-b from-[#8E8E93] to-[#D1D1D6] rounded-l-full" />
                <div className="absolute left-[-3px] top-56 w-[3px] h-14 bg-gradient-to-b from-[#8E8E93] to-[#D1D1D6] rounded-l-full" />
                <div className="absolute right-[-3px] top-44 w-[3px] h-16 bg-gradient-to-b from-[#8E8E93] to-[#D1D1D6] rounded-r-full" />
              </motion.div>
            </motion.div>

            {/* CTA Buttons */}
            <AnimatePresence>
              {showCTA && (
                <motion.div
                  className="flex flex-col sm:flex-row items-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.6 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleReplay}
                    className="bg-white/10 backdrop-blur-xl border-white/30 text-white hover:bg-white/20 rounded-full px-6 py-6"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Rejouer
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleStartExperience}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-full px-10 py-6 text-lg font-semibold shadow-xl shadow-primary/40"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Commencer l'expérience
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${(currentTime / 15) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Sub-components for each phase

const PulseDashboard = ({ showNotification, expandWidget }: { showNotification: boolean; expandWidget: boolean }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.p 
            className="text-xs text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Bonsoir 👋
          </motion.p>
          <motion.h2 
            className="text-lg font-bold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            Marie
          </motion.h2>
        </div>
        <motion.div 
          className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
        />
      </div>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-xl p-3 border border-white/50 shadow-lg"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-900">Good evening!</p>
              <p className="text-[10px] text-gray-600">Tu as 3 cours demain</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Widget */}
      <motion.div
        layoutId="schedule-widget"
        className={cn(
          "bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-4 border border-white/50",
          expandWidget && "scale-105"
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-gray-900">Today's Schedule</span>
        </div>
        
        <div className="space-y-2">
          {[
            { time: "09:00", name: "Économie", color: "bg-blue-500" },
            { time: "11:00", name: "Marketing", color: "bg-green-500" },
            { time: "14:00", name: "Droit Civil", color: "bg-purple-500" }
          ].map((course, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 bg-white/60 rounded-lg p-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + i * 0.2 }}
            >
              <div className={cn("w-1 h-8 rounded-full", course.color)} />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-gray-900">{course.name}</p>
                <p className="text-[9px] text-gray-600">{course.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div 
          className="bg-white/60 rounded-xl p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
        >
          <Brain className="w-5 h-5 text-primary mb-1" />
          <p className="text-[10px] font-semibold text-gray-900">Exam Lab</p>
        </motion.div>
        <motion.div 
          className="bg-white/60 rounded-xl p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4 }}
        >
          <Camera className="w-5 h-5 text-accent mb-1" />
          <p className="text-[10px] font-semibold text-gray-900">Vault</p>
        </motion.div>
      </div>
    </div>
  );
};

const PocketSpaceView = ({ showCursor }: { showCursor: boolean }) => {
  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900">Semaine 5</h2>
        <div className="flex gap-1">
          {['L', 'M', 'M', 'J', 'V'].map((day, i) => (
            <div
              key={i}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium",
                i === 2 ? "bg-primary text-white" : "text-gray-600"
              )}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Time Grid */}
      <div className="space-y-2 relative">
        {/* Time slots */}
        {['09:00', '11:00', '14:00', '16:00'].map((time, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-[8px] text-gray-500 w-8 pt-1">{time}</span>
            <div className="flex-1 min-h-[32px] relative">
              {/* Show courses - special case for 14:00 with two side-by-side courses */}
              {time === '09:00' && (
                <motion.div
                  className="absolute inset-0 bg-blue-500/20 border-l-2 border-blue-500 rounded-lg p-1.5"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-[9px] font-semibold text-gray-900">Économie</p>
                  <p className="text-[8px] text-gray-600">Salle 101</p>
                </motion.div>
              )}
              {time === '11:00' && (
                <motion.div
                  className="absolute inset-0 bg-green-500/20 border-l-2 border-green-500 rounded-lg p-1.5"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-[9px] font-semibold text-gray-900">Marketing</p>
                  <p className="text-[8px] text-gray-600">Salle 203</p>
                </motion.div>
              )}
              {/* TWO COURSES AT 14:00 - SIDE BY SIDE (50% each) - PROOF OF NO OVERLAP */}
              {time === '14:00' && (
                <div className="absolute inset-0 flex gap-1">
                  <motion.div
                    className="flex-1 bg-purple-500/20 border-l-2 border-purple-500 rounded-lg p-1.5"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <p className="text-[9px] font-semibold text-gray-900">Droit</p>
                    <p className="text-[8px] text-gray-600">A1</p>
                  </motion.div>
                  <motion.div
                    className="flex-1 bg-orange-500/20 border-l-2 border-orange-500 rounded-lg p-1.5"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <p className="text-[9px] font-semibold text-gray-900">Compta</p>
                    <p className="text-[8px] text-gray-600">B2</p>
                  </motion.div>
                </div>
              )}
              {time === '16:00' && (
                <motion.div
                  className="absolute inset-0 bg-pink-500/20 border-l-2 border-pink-500 rounded-lg p-1.5"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <p className="text-[9px] font-semibold text-gray-900">Anglais</p>
                  <p className="text-[8px] text-gray-600">Labo</p>
                </motion.div>
              )}
            </div>
          </div>
        ))}

        {/* Animated Cursor */}
        {showCursor && (
          <motion.div
            className="absolute w-5 h-5 pointer-events-none z-20"
            initial={{ opacity: 0, x: 100, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              x: [100, 60, 60, 60],
              y: [0, 70, 70, 70],
              scale: [1, 1, 0.8, 0.8]
            }}
            transition={{ 
              duration: 2,
              times: [0, 0.3, 0.6, 1]
            }}
          >
            <svg viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1">
              <path d="M4 4L10 20L12 12L20 10L4 4Z" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
        <span className="text-[8px] px-2 py-1 bg-white/60 rounded-full text-gray-600">
          📅 Pas de superposition
        </span>
      </div>
    </div>
  );
};

const CourseHubView = () => {
  return (
    <div className="h-full">
      {/* Header with glass effect */}
      <motion.div
        className="bg-gradient-to-br from-purple-500/30 to-purple-500/10 rounded-2xl p-4 mb-4 border border-white/40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⚖️</span>
          <span className="text-xs font-semibold text-gray-900">Droit Civil</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">14:00 - 16:00</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px]">Salle A1</span>
          </div>
        </div>
      </motion.div>

      {/* Auto-Vault Section */}
      <motion.div
        className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-white/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-gray-900">Notes visuelles</span>
        </div>
        
        <motion.div
          className="bg-gradient-to-r from-primary to-accent rounded-xl p-3 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <Camera className="w-6 h-6 text-white mx-auto mb-1" />
          <p className="text-[10px] font-semibold text-white">Prendre une photo</p>
          <p className="text-[8px] text-white/80">Auto-classé dans Droit</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

const AILabView = ({ showNotification, showFlashcard }: { showNotification: boolean; showFlashcard: boolean }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-5 h-5 text-primary" />
          </motion.div>
          <span className="text-sm font-bold text-gray-900">Exam Lab</span>
        </div>
        
        {/* Sparkle Animation */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-5 h-5 text-accent" />
        </motion.div>
      </div>

      {/* AI Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-3 mb-4 border border-primary/30"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Bell className="w-4 h-4 text-primary" />
              </motion.div>
              <div>
                <p className="text-xs font-semibold text-gray-900">L'IA a résumé ton cours</p>
                <p className="text-[10px] text-gray-600">Droit Civil • 14h</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcard */}
      <AnimatePresence>
        {showFlashcard && (
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
          >
            <div className="w-full bg-gradient-to-br from-primary to-accent rounded-2xl p-4 shadow-xl">
              <div className="bg-white/20 rounded-xl p-4 text-center">
                <p className="text-[9px] text-white/80 mb-2">Question</p>
                <p className="text-xs font-semibold text-white mb-4">
                  Qu'est-ce que le principe de non-rétroactivité des lois ?
                </p>
                <motion.div
                  className="bg-white rounded-lg p-2 flex items-center justify-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-[10px] font-medium text-primary">Voir la réponse</span>
                  <ChevronRight className="w-3 h-3 text-primary" />
                </motion.div>
              </div>
              
              {/* Card count */}
              <div className="flex justify-center mt-3 gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      i === 1 ? "bg-white" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      {!showFlashcard && (
        <div className="mt-auto grid grid-cols-2 gap-2">
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary">12</p>
            <p className="text-[9px] text-gray-600">Flashcards</p>
          </div>
          <div className="bg-white/60 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-500">85%</p>
            <p className="text-[9px] text-gray-600">Maîtrisées</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoTheatre;
