import { useMemo, useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent, Subject } from "@/hooks/useOrbitData";
import { GlassCard } from "@/components/GlassCard";
import { Clock, MapPin, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfessionalCalendarProps {
  events: CalendarEvent[];
  subjects: Subject[];
  onStudyFocus?: (event: CalendarEvent) => void;
}

export const ProfessionalCalendar = ({
  events,
  subjects,
  onStudyFocus,
}: ProfessionalCalendarProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const getSubject = (subjectId: string | null) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getSubjectColor = (subjectId: string | null) => {
    const subject = getSubject(subjectId);
    const colorMap: Record<string, string> = {
      math: '#007AFF',      // Primary blue
      history: '#FF9500',   // Warning amber
      physics: '#34C759',   // Success green
      english: '#AF52DE',   // Purple
      chemistry: '#FF3B30', // Red
    };
    return colorMap[subject?.color_key || 'math'] || '#007AFF';
  };

  // Convert CalendarEvent to FullCalendar format
  // Generate events for each day of the week
  const calendarEvents = useMemo(() => {
    const fcEvents: any[] = [];
    const today = new Date();
    
    // Generate events for current week and next 4 weeks
    for (let weekOffset = -1; weekOffset <= 4; weekOffset++) {
      events.forEach(event => {
        const subject = getSubject(event.subject_id);
        
        // Calculate the date for this event
        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() - today.getDay() + event.day_of_week + (weekOffset * 7));
        
        const [startHour, startMin] = event.start_time.split(':').map(Number);
        const [endHour, endMin] = event.end_time.split(':').map(Number);
        
        const start = new Date(eventDate);
        start.setHours(startHour, startMin, 0, 0);
        
        const end = new Date(eventDate);
        end.setHours(endHour, endMin, 0, 0);

        fcEvents.push({
          id: `${event.id}-${weekOffset}`,
          title: subject?.name || event.title,
          start,
          end,
          backgroundColor: getSubjectColor(event.subject_id),
          borderColor: getSubjectColor(event.subject_id),
          textColor: '#FFFFFF',
          extendedProps: {
            originalEvent: event,
            subject,
            icon: subject?.icon || '📚',
            room: event.room_number,
            teacher: event.teacher_name,
            isExam: event.event_type === 'exam',
          },
        });
      });
    }

    return fcEvents;
  }, [events, subjects]);

  const handleDateClick = (info: any) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView('timeGridDay', info.date);
    }
  };

  const handleEventClick = (info: any) => {
    const originalEvent = info.event.extendedProps.originalEvent as CalendarEvent;
    setSelectedEvent(originalEvent);
  };

  const renderEventContent = (eventInfo: any) => {
    const { icon, room, isExam } = eventInfo.event.extendedProps;
    const isTimeGrid = eventInfo.view.type.includes('timeGrid');
    
    if (!isTimeGrid) {
      // Month view - just show dot
      return (
        <div className="flex items-center gap-1 px-1 py-0.5 overflow-hidden">
          <span className="text-[10px]">{icon}</span>
          <span className="text-[10px] font-medium truncate">{eventInfo.event.title}</span>
          {isExam && <span className="text-[10px]">📝</span>}
        </div>
      );
    }

    // Day/Week view - show full block
    return (
      <div className="p-1.5 h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-1">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold truncate">{eventInfo.event.title}</span>
          {isExam && <span className="text-xs">📝</span>}
        </div>
        {room && (
          <div className="flex items-center gap-0.5 mt-0.5 text-[10px] opacity-90">
            <MapPin className="w-2.5 h-2.5" />
            <span className="truncate">{room}</span>
          </div>
        )}
        <span className="text-[10px] opacity-75 mt-auto">
          {eventInfo.timeText}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Container */}
      <GlassCard className="p-3 overflow-hidden">
        <div className="fullcalendar-wrapper">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventContent={renderEventContent}
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="21:00:00"
            slotDuration="00:30:00"
            allDaySlot={false}
            weekends={true}
            nowIndicator={true}
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
            stickyHeaderDates={true}
            expandRows={true}
          />
        </div>
      </GlassCard>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm p-5 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {getSubject(selectedEvent.subject_id)?.icon || '📚'}
                </span>
                <div>
                  <h3 className="font-display font-bold text-lg">
                    {getSubject(selectedEvent.subject_id)?.name || selectedEvent.title}
                  </h3>
                  {selectedEvent.event_type === 'exam' && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                      📝 Exam
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
                className="rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {selectedEvent.start_time.slice(0, 5)} - {selectedEvent.end_time.slice(0, 5)}
                </span>
              </div>

              {selectedEvent.room_number && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedEvent.room_number}</span>
                </div>
              )}

              {selectedEvent.teacher_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{selectedEvent.teacher_name}</span>
                </div>
              )}
            </div>

            {onStudyFocus && (
              <Button
                className="w-full mt-4 gradient-primary"
                onClick={() => {
                  onStudyFocus(selectedEvent);
                  setSelectedEvent(null);
                }}
              >
                📖 Study Focus Mode
              </Button>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};