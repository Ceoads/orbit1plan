import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  subjectName?: string;
  colorKey?: string;
  eventType?: string;
  isCurrentEvent?: boolean;
}

interface ClassTimelineProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
}

const getSubjectColor = (colorKey?: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    math: { bg: "bg-blue-100/80", text: "text-blue-700", border: "border-blue-200" },
    physics: { bg: "bg-sky-100/80", text: "text-sky-700", border: "border-sky-200" },
    history: { bg: "bg-orange-100/80", text: "text-orange-700", border: "border-orange-200" },
    geometry: { bg: "bg-emerald-100/80", text: "text-emerald-700", border: "border-emerald-200" },
    chemistry: { bg: "bg-amber-100/80", text: "text-amber-700", border: "border-amber-200" },
    english: { bg: "bg-violet-100/80", text: "text-violet-700", border: "border-violet-200" },
    default: { bg: "bg-gray-100/80", text: "text-gray-700", border: "border-gray-200" },
  };
  return colors[colorKey || "default"] || colors.default;
};

export const ClassTimeline = ({ events, onEventClick }: ClassTimelineProps) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No upcoming classes today</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-[52px] top-0 bottom-0 w-px bg-border" />

      <div className="space-y-3">
        {events.map((event, index) => {
          const colors = getSubjectColor(event.colorKey);
          const isFirst = index === 0;
          
          return (
            <div 
              key={event.id}
              className="flex items-start gap-4"
              onClick={() => onEventClick?.(event)}
            >
              {/* Time Column */}
              <div className="w-12 flex-shrink-0 text-right">
                <span className="text-xs font-medium text-muted-foreground">
                  {event.startTime.slice(0, 5)}
                </span>
              </div>

              {/* Timeline Dot */}
              <div className="relative flex-shrink-0 z-10">
                <div className={cn(
                  "w-3 h-3 rounded-full border-2 bg-background transition-all",
                  event.isCurrentEvent 
                    ? "border-primary bg-primary scale-125" 
                    : "border-muted-foreground/30"
                )} />
              </div>

              {/* Event Card */}
              <div 
                className={cn(
                  "flex-1 rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-soft",
                  colors.bg,
                  colors.border,
                  event.isCurrentEvent && "ring-2 ring-primary/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className={cn("font-semibold text-sm", colors.text)}>
                      {event.subjectName || event.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.startTime.slice(0, 5)} - {event.endTime.slice(0, 5)}
                    </p>
                  </div>
                  
                  {/* Event Type Badge */}
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    event.eventType === 'exam' 
                      ? "bg-destructive/10 text-destructive"
                      : `${colors.text} bg-white/50`
                  )}>
                    {event.eventType === 'exam' ? 'Exam' : 'Class'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};