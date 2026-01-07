import { Camera, Mic, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getCurrentClass, getSubjectById } from "@/lib/mockData";

interface SmartCaptureButtonProps {
  onCapture?: (type: 'photo' | 'voice') => void;
}

export const SmartCaptureButton = ({ onCapture }: SmartCaptureButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentClass = getCurrentClass();
  const subject = currentClass ? getSubjectById(currentClass.subjectId) : null;

  const handleCapture = (type: 'photo' | 'voice') => {
    onCapture?.(type);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* Expanded options */}
      <div 
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex gap-3 transition-all duration-300",
          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <button
          onClick={() => handleCapture('photo')}
          className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-lg border border-white/40 shadow-elevated flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <Camera className="w-6 h-6 text-primary" />
        </button>
        <button
          onClick={() => handleCapture('voice')}
          className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-lg border border-white/40 shadow-elevated flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <Mic className="w-6 h-6 text-destructive" />
        </button>
      </div>

      {/* Main button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "relative w-16 h-16 rounded-full shadow-elevated transition-all duration-300 flex items-center justify-center",
          "bg-gradient-to-br from-primary to-primary/80",
          "hover:scale-105 active:scale-95",
          isExpanded && "rotate-45"
        )}
      >
        <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
        
        {/* Pulse effect */}
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      </button>

      {/* Context label */}
      {subject && !isExpanded && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-soft text-foreground">
            Will tag as {subject.icon} {subject.name}
          </span>
        </div>
      )}
    </div>
  );
};
