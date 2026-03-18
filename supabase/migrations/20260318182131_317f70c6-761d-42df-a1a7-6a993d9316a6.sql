-- Add event_date column to calendar_events
ALTER TABLE public.calendar_events 
ADD COLUMN event_date date;

-- Backfill: for exams, use exam_date
UPDATE public.calendar_events 
SET event_date = exam_date 
WHERE event_type = 'exam' AND exam_date IS NOT NULL;

-- Create index for efficient date-based queries
CREATE INDEX idx_calendar_events_event_date ON public.calendar_events(event_date);
CREATE INDEX idx_calendar_events_user_date ON public.calendar_events(user_id, event_date);