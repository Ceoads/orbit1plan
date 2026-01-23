import { motion } from "framer-motion";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'exams' | 'tasks' | 'notes';
}

const illustrations: Record<string, string> = {
  default: '🌙',
  exams: '😴',
  tasks: '✨',
  notes: '📚',
};

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Illustration Circle */}
      <motion.div
        className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/60 to-primary/20 flex items-center justify-center mb-6"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <span className="text-5xl">
          {icon || illustrations[variant]}
        </span>
      </motion.div>

      {/* Title */}
      <motion.h3
        className="font-display text-xl font-bold text-foreground mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          className="text-muted-foreground text-sm max-w-xs leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {description}
        </motion.p>
      )}

      {/* Action */}
      {action && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
};
