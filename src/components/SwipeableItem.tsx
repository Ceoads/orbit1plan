import { useState, useRef } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableItemProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const SwipeableItem = ({
  children,
  onEdit,
  onDelete,
  className,
}: SwipeableItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const controls = useAnimation();
  const constraintsRef = useRef(null);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 60;
    
    if (info.offset.x < -threshold) {
      // Swiped left - show actions
      controls.start({ x: -120 });
      setIsOpen(true);
    } else if (info.offset.x > threshold && isOpen) {
      // Swiped right - close actions
      controls.start({ x: 0 });
      setIsOpen(false);
    } else {
      // Snap back
      controls.start({ x: isOpen ? -120 : 0 });
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    controls.start({ x: 0 });
    setIsOpen(false);
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)} ref={constraintsRef}>
      {/* Action buttons behind */}
      <div className="absolute inset-y-0 right-0 flex items-stretch z-0">
        {onEdit && (
          <button
            onClick={handleEdit}
            className="w-14 flex items-center justify-center bg-primary text-primary-foreground"
          >
            <Edit className="w-5 h-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="w-14 flex items-center justify-center bg-destructive text-destructive-foreground"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative z-10 bg-background cursor-grab active:cursor-grabbing"
        onClick={() => {
          if (isOpen) {
            controls.start({ x: 0 });
            setIsOpen(false);
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
