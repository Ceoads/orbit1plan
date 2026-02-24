
CREATE TABLE public.timeline_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'personal',
  icon TEXT DEFAULT '📝',
  color TEXT DEFAULT '#ff9f6b',
  scheduled_at TIMESTAMPTZ NOT NULL,
  estimated_duration INTEGER NOT NULL,
  priority TEXT DEFAULT 'medium',
  note TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.timeline_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timeline tasks"
  ON public.timeline_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own timeline tasks"
  ON public.timeline_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timeline tasks"
  ON public.timeline_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timeline tasks"
  ON public.timeline_tasks FOR DELETE
  USING (auth.uid() = user_id);
