import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";

interface CalendarMonthViewProps {
  events: CalendarEvent[];
  subjects: Subject[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export const CalendarMonthView = ({
  events,
  subjects,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: CalendarMonthViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  const getEventsForDay = (date: Date) => {
    return events.filter(e => e.day_of_week === date.getDay());
  };
  
  const getSubjectColor = (subjectId: string | null) => {
    const subject = subjects.find(s => s.id === subjectId);
    const colorKey = subject?.color_key || 'math';
    const colorMap: Record<string, string> = {
      math: 'bg-primary',
      history: 'bg-warning',
      physics: 'bg-success',
      english: 'bg-[hsl(280,67%,55%)]',
      chemistry: 'bg-destructive',
    };
    return colorMap[colorKey] || 'bg-primary';
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
    onMonthChange(newMonth);
  };
  
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };
  
  const days = getMonthDays(currentMonth);
  
  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigateMonth('prev')}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="font-display font-semibold text-foreground">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigateMonth('next')}
          className="rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const dayEvents = date ? getEventsForDay(date) : [];
          const uniqueSubjects = [...new Set(dayEvents.map(e => e.subject_id))];
          
          return (
            <button
              key={index}
              onClick={() => date && onDateSelect(date)}
              disabled={!date}
              className={cn(
                "aspect-square p-1 rounded-xl transition-all flex flex-col items-center justify-center relative",
                date && "hover:bg-accent cursor-pointer",
                isToday(date) && "ring-2 ring-primary ring-offset-2",
                isSelected(date) && "bg-primary text-primary-foreground",
                !date && "cursor-default"
              )}
            >
              {date && (
                <>
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected(date) ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {date.getDate()}
                  </span>
                  
                  {/* Event Dots */}
                  {uniqueSubjects.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {uniqueSubjects.slice(0, 3).map((subjectId, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isSelected(date) ? "bg-primary-foreground/80" : getSubjectColor(subjectId)
                          )}
                        />
                      ))}
                      {uniqueSubjects.length > 3 && (
                        <span className={cn(
                          "text-[8px]",
                          isSelected(date) ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          +{uniqueSubjects.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};