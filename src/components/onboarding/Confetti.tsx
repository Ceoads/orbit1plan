/**
 * Pastel Confetti Animation
 * Subtle celebration effect for tutorial completion
 */

import { motion } from "framer-motion";
import { useMemo } from "react";

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "#FFB5A7", // Soft coral
  "#FCD5CE", // Soft peach
  "#F8EDEB", // Cream
  "#D8E2DC", // Soft sage
];

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  type: "circle" | "square" | "star";
}

const Confetti = () => {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      type: ["circle", "square", "star"][Math.floor(Math.random() * 3)] as "circle" | "square" | "star",
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}vw`,
            y: -20,
            rotate: piece.rotation,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            y: "110vh",
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
            scale: [0, 1, 0.8],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.type !== "star" ? piece.color : "transparent",
            borderRadius: piece.type === "circle" ? "50%" : piece.type === "square" ? "2px" : 0,
          }}
          className={piece.type === "star" ? "star-confetti" : ""}
        >
          {piece.type === "star" && (
            <svg
              width={piece.size}
              height={piece.size}
              viewBox="0 0 24 24"
              fill={piece.color}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </motion.div>
      ))}

      {/* Central burst effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-radial from-primary/30 to-transparent"
      />
    </div>
  );
};

export default Confetti;
