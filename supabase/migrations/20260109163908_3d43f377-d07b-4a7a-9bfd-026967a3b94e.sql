-- Add ical_filter_group column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS ical_filter_group text;