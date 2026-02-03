import { useState, useRef, ReactNode, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { NavTab } from "./BottomNav";
import { useHaptics } from "@/hooks/useHaptics";

const TAB_ORDER: NavTab[] = ['pulse', 'vault', 'tasks', 'exams', 'lab'];

// Edge zone width in pixels - swipes must start within this zone from screen edges
const EDGE_ZONE_WIDTH = 30;

interface SwipeablePagesProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  children: Record<NavTab, ReactNode>;
}

export const SwipeablePages = ({ activeTab, onTabChange, children }: SwipeablePagesProps) => {
  const haptics = useHaptics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const isEdgeSwipe = useRef(false);
  
  const currentIndex = TAB_ORDER.indexOf(activeTab);
  
  // Check if the swipe started from the edge of the screen
  const handleDragStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    const clientX = 'touches' in event 
      ? event.touches[0].clientX 
      : (event as MouseEvent).clientX;
    
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    
    // Check if drag started from left or right edge
    const isLeftEdge = clientX <= EDGE_ZONE_WIDTH;
    const isRightEdge = clientX >= containerWidth - EDGE_ZONE_WIDTH;
    
    isEdgeSwipe.current = isLeftEdge || isRightEdge;
    dragStartX.current = clientX;
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Only process swipes that started from the edge
    if (!isEdgeSwipe.current) {
      return;
    }
    
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
    
    isEdgeSwipe.current = false;
    dragStartX.current = null;
  }, [currentIndex, haptics, onTabChange]);

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
          dragElastic={isEdgeSwipe.current ? 0.2 : 0}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="w-full h-full"
        >
          {children[activeTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export { TAB_ORDER };
