/**
 * Spotlight Overlay Component
 * Creates an iOS-style spotlight effect that highlights specific UI elements
 */

import { motion } from "framer-motion";
import { ReactNode } from "react";
import Lottie from "lottie-react";

interface SpotlightOverlayProps {
  /** Target element selector or rect position */
  targetRect?: DOMRect | null;
  /** Message to display */
  message: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Position of tooltip relative to spotlight */
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  /** Children (action buttons) */
  children?: ReactNode;
  /** Whether to show the overlay */
  isVisible: boolean;
  /** Lottie animation data */
  animationData?: object;
}

export const SpotlightOverlay = ({
  targetRect,
  message,
  subtitle,
  tooltipPosition = "bottom",
  children,
  isVisible,
  animationData,
}: SpotlightOverlayProps) => {
  if (!isVisible) return null;

  // Default center position if no target
  const spotlightX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2;
  const spotlightY = targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight / 2;
  const spotlightRadius = targetRect 
    ? Math.max(targetRect.width, targetRect.height) / 2 + 20 
    : 80;

  // Tooltip positioning
  const getTooltipStyle = () => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, 100px)" };
    }

    const padding = 20;
    switch (tooltipPosition) {
      case "top":
        return {
          bottom: window.innerHeight - targetRect.top + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
      case "bottom":
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2,
          right: window.innerWidth - targetRect.left + padding,
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + padding,
          transform: "translateY(-50%)",
        };
      default:
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] pointer-events-auto"
    >
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.circle
              initial={{ r: 0 }}
              animate={{ r: spotlightRadius }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              cx={spotlightX}
              cy={spotlightY}
              fill="black"
            />
          </mask>
          <filter id="blur-filter">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        <motion.rect
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.8)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Pulsing ring around spotlight */}
      {targetRect && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          style={{
            position: "absolute",
            left: spotlightX - spotlightRadius - 5,
            top: spotlightY - spotlightRadius - 5,
            width: (spotlightRadius + 5) * 2,
            height: (spotlightRadius + 5) * 2,
          }}
          className="rounded-full border-2 border-primary/50 pointer-events-none"
        />
      )}

      {/* Glassmorphism Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
        style={getTooltipStyle()}
        className="fixed max-w-xs p-5 rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/50 pointer-events-auto"
      >
        {/* Pointer arrow */}
        {targetRect && tooltipPosition === "bottom" && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 border-l border-t border-white/50" />
        )}
        {targetRect && tooltipPosition === "top" && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 border-r border-b border-white/50" />
        )}

        {/* Lottie Animation */}
        {animationData && (
          <div className="flex justify-center mb-3">
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: 80, height: 80 }}
            />
          </div>
        )}

        <p className="font-display font-semibold text-foreground text-center mb-1">
          {message}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground text-center mb-4">
            {subtitle}
          </p>
        )}
        
        {children && (
          <div className="flex justify-center gap-3 mt-4">
            {children}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
