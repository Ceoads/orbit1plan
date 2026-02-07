import { useState, useEffect, useRef } from "react";

type ScrollDirection = "up" | "down" | null;

interface UseScrollDirectionOptions {
  threshold?: number;
  disabled?: boolean;
}

export const useScrollDirection = (options: UseScrollDirectionOptions = {}) => {
  const { threshold = 10, disabled = false } = options;
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (disabled) {
      setScrollDirection(null);
      setIsAtTop(true);
      return;
    }

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      
      // Check if at top
      setIsAtTop(scrollY < 10);
      
      // Determine direction with threshold
      const direction = scrollY > lastScrollY.current ? "down" : "up";
      const diff = Math.abs(scrollY - lastScrollY.current);
      
      if (diff > threshold) {
        setScrollDirection(direction);
        lastScrollY.current = scrollY;
      }
      
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Set initial state
    lastScrollY.current = window.scrollY;
    setIsAtTop(window.scrollY < 10);

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, disabled]);

  return { scrollDirection, isAtTop };
};
