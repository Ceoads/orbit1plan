-- Add image_url column to flashcards table for AI-generated visual flashcards
ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_prompt TEXT;