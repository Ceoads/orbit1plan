import { useState, useRef, ReactNode } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { NavTab } from "./BottomNav";
import { useHaptics } from "@/hooks/useHaptics";

const TAB_ORDER: NavTab[] = ['pulse', 'vault', 'tasks', 'exams', 'lab'];

interface SwipeablePagesProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  children: Record<NavTab, ReactNode>;
}

export const SwipeablePages = ({ activeTab, onTabChange, children }: SwipeablePagesProps) => {
  const haptics = useHaptics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(0);
  
  const currentIndex = TAB_ORDER.indexOf(activeTab);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    
    // Determine if swipe was significant enough
    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      if (offset > 0 && currentIndex > 0) {
        // Swipe right -> go to previous tab
        setDirection(-1);
        haptics.selection();
        onTabChange(TAB_ORDER[currentIndex - 1]);
      } else if (offset < 0 && currentIndex < TAB_ORDER.length - 1) {
        // Swipe left -> go to next tab
        setDirection(1);
        haptics.selection();
        onTabChange(TAB_ORDER[currentIndex + 1]);
      }
    }
  };

  // Update direction when tab changes externally (from bottom nav)
  const handleTabChange = (newTab: NavTab) => {
    const newIndex = TAB_ORDER.indexOf(newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    onTabChange(newTab);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={activeTab}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="w-full h-full"
        >
          {children[activeTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Export function to get direction setter for external use
export { TAB_ORDER };
