import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  onClick?: () => void;
}

export const GlassCard = ({ 
  children, 
  className, 
  variant = 'default',
  onClick 
}: GlassCardProps) => {
  const variants = {
    default: "bg-white/70 backdrop-blur-xl border border-white/30 shadow-glass",
    elevated: "bg-white/80 backdrop-blur-2xl border border-white/40 shadow-elevated",
    subtle: "bg-white/50 backdrop-blur-lg border border-white/20 shadow-soft",
  };

  return (
    <div 
      className={cn(
        "rounded-2xl transition-all duration-300",
        variants[variant],
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
