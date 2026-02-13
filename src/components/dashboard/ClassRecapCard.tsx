import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassRecapCardProps {
  subjectName: string;
  subjectIcon?: string;
  startTime: string;
  endTime: string;
  teacherName?: string | null;
  roomNumber?: string | null;
  isCurrentClass?: boolean;
}

export const ClassRecapCard = ({
  subjectName,
  subjectIcon,
  startTime,
  endTime,
  teacherName,
  roomNumber,
  isCurrentClass = false,
}: ClassRecapCardProps) => {
  return (
    <div className="gradient-primary rounded-3xl p-6 text-white shadow-elevated relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10 blur-lg" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {subjectIcon && <span className="text-2xl">{subjectIcon}</span>}
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {subjectName}
              </h2>
            </div>
            {isCurrentClass && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-sm font-medium text-white/90">En cours actuellement</span>
              </div>
            )}
          </div>
        </div>

        {/* Time & Room */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{startTime} - {endTime}</span>
          </div>
          {roomNumber && (
            <div className="bg-white/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
              <span className="text-sm font-medium">📍 {roomNumber}</span>
            </div>
          )}
        </div>

        {/* Teacher */}
        {teacherName && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <p className="text-sm text-white/70">Professeur</p>
              <p className="font-semibold">{teacherName}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};