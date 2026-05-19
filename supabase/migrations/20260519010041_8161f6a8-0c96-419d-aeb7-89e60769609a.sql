CREATE TABLE public.quiz_debug_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  req_id text NOT NULL,
  note_id uuid,
  subject_id uuid,
  source_kind text,
  source_mime text,
  original_bytes integer,
  segments_count integer,
  segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  candidate_questions_count integer,
  merge_used boolean NOT NULL DEFAULT false,
  final_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_duration_ms integer,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_debug_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz debug runs"
ON public.quiz_debug_runs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz debug runs"
ON public.quiz_debug_runs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz debug runs"
ON public.quiz_debug_runs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz debug runs"
ON public.quiz_debug_runs FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_quiz_debug_runs_user_created ON public.quiz_debug_runs(user_id, created_at DESC);
CREATE INDEX idx_quiz_debug_runs_req_id ON public.quiz_debug_runs(req_id);