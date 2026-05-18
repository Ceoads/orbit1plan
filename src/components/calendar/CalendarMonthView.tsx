import { useState } from "react";
import { toLocalDateStr } from "@/lib/dateFormat";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  
  const daysOfWeek = i18n.language === 'fr' 
    ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
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
    const dateStr = toLocalDateStr(date);
    return events.filter(e => {
      if (e.event_date) return e.event_date === dateStr;
      return e.day_of_week === date.getDay();
    });
  };

  const hasExamOnDay = (date: Date) => {
    return events.some(e => {
      if (e.event_type !== 'exam' || !e.exam_date) return false;
      const examDate = new Date(e.exam_date);
      return examDate.toDateString() === date.toDateString();
    });
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
          className="rounded-full h-9 w-9"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="font-display font-semibold text-foreground text-lg">
          {currentMonth.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigateMonth('next')}
          className="rounded-full h-9 w-9"
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
          const hasEvents = dayEvents.length > 0;
          const hasExam = date ? hasExamOnDay(date) : false;
          
          return (
            <button
              key={index}
              onClick={() => date && onDateSelect(date)}
              disabled={!date}
              className={cn(
                "aspect-square p-1 transition-all flex flex-col items-center justify-center relative",
                date && "hover:bg-accent cursor-pointer",
                isToday(date) && !isSelected(date) && "ring-2 ring-primary ring-inset rounded-xl",
                isToday(date) && isSelected(date) && "bg-primary text-primary-foreground rounded-xl shadow-lg",
                !isToday(date) && isSelected(date) && "bg-primary/10 rounded-xl",
                !date && "cursor-default"
              )}
            >
              {date && (
                <>
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(date) && isSelected(date) ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {date.getDate()}
                  </span>
                  
                  {/* Exam emoji indicator */}
                  {hasExam && (
                    <span className="absolute top-0.5 right-0.5 text-[10px] leading-none">📚</span>
                  )}
                  
                  {/* Event Dots - Orange for classes, Red for exams */}
                  {(hasEvents || hasExam) && (
                    <div className="flex gap-0.5 mt-0.5 absolute bottom-1">
                      {hasEvents && !hasExam && (
                        <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                      )}
                      {hasExam && (
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
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
