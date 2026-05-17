import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useSmartBack } from "@/hooks/useSmartBack";
import { cn } from "@/lib/utils";

interface IOSBackButtonProps {
  /** Optional label next to the chevron. Defaults to "Retour". Pass "" to hide. */
  label?: string;
  /** Fallback route when there's no browser history (deep link, refresh). */
  fallback?: string;
  /** Override smart behavior with a custom handler. */
  onClick?: () => void;
  className?: string;
}

/**
 * Standardized iOS-style back button.
 * - 44×44pt minimum tap target (HIG)
 * - Chevron + label, primary color
 * - Uses useSmartBack so it actually returns to the previous screen
 * - aria-label for screen readers
 */
export const IOSBackButton = ({
  label = "Retour",
  fallback = "/",
  onClick,
  className,
}: IOSBackButtonProps) => {
  const smartBack = useSmartBack(fallback);
  const handleClick = onClick ?? smartBack;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={label || "Retour"}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "inline-flex items-center gap-0.5 -ml-2 pl-1 pr-3",
        "min-h-[44px] min-w-[44px]",
        "text-primary active:opacity-60 transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl",
        className,
      )}
    >
      <ChevronLeft className="w-6 h-6 -mr-1" strokeWidth={2.5} />
      {label && (
        <span className="text-[17px] font-medium leading-none">{label}</span>
      )}
    </motion.button>
  );
};
