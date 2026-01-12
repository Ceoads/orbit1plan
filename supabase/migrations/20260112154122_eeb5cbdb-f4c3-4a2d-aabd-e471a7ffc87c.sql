-- Add ical_code to subjects for iCal filtering
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS ical_code TEXT;

-- Create academic_years table for hierarchical organization
CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL, -- e.g., "2024-2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create semesters table
CREATE TABLE IF NOT EXISTS public.semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Semestre 1"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create vault_files table for the new file storage system
CREATE TABLE IF NOT EXISTS public.vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  extracted_text TEXT, -- OCR text
  ai_summary TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_detected_subject TEXT, -- What AI thought this was
  ai_confidence FLOAT, -- Confidence score 0-1
  filing_status TEXT DEFAULT 'pending', -- pending, confirmed, changed
  original_filename TEXT,
  file_type TEXT, -- image, pdf, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create vault_filing_history for learning from user corrections
CREATE TABLE IF NOT EXISTS public.vault_filing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_id UUID REFERENCES public.vault_files(id) ON DELETE CASCADE,
  ai_suggested_subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  final_subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  was_correct BOOLEAN DEFAULT false, -- Did user accept AI suggestion?
  context_data JSONB, -- Store context: time, location, current class, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_filing_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for academic_years
CREATE POLICY "Users can view own academic years" ON public.academic_years FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own academic years" ON public.academic_years FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own academic years" ON public.academic_years FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own academic years" ON public.academic_years FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for semesters
CREATE POLICY "Users can view own semesters" ON public.semesters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own semesters" ON public.semesters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own semesters" ON public.semesters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own semesters" ON public.semesters FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for vault_files
CREATE POLICY "Users can view own vault files" ON public.vault_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own vault files" ON public.vault_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vault files" ON public.vault_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vault files" ON public.vault_files FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for vault_filing_history
CREATE POLICY "Users can view own filing history" ON public.vault_filing_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own filing history" ON public.vault_filing_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own filing history" ON public.vault_filing_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own filing history" ON public.vault_filing_history FOR DELETE USING (auth.uid() = user_id);

-- Create index for OCR text search
CREATE INDEX IF NOT EXISTS idx_vault_files_extracted_text ON public.vault_files USING gin(to_tsvector('french', COALESCE(extracted_text, '')));
CREATE INDEX IF NOT EXISTS idx_vault_files_subject ON public.vault_files(subject_id);
CREATE INDEX IF NOT EXISTS idx_vault_files_semester ON public.vault_files(semester_id);
CREATE INDEX IF NOT EXISTS idx_vault_files_tags ON public.vault_files USING gin(tags);

-- Trigger for updated_at
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_semesters_updated_at BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_vault_files_updated_at BEFORE UPDATE ON public.vault_files FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();