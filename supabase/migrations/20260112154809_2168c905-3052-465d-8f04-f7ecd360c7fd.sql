-- Fix GDPR compliance: Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add campus location to user settings for geolocation feature
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS campus_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS campus_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS campus_radius_meters INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS campus_name TEXT;

-- Add last known location tracking for context
ALTER TABLE public.vault_files 
ADD COLUMN IF NOT EXISTS capture_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS capture_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS was_on_campus BOOLEAN DEFAULT NULL;