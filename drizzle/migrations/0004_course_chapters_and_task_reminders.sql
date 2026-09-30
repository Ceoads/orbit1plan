CREATE TABLE public.course_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nouveau chapitre',
  content text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_chapters TO authenticated;
GRANT ALL ON public.course_chapters TO service_role;
ALTER TABLE public.course_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chapters select" ON public.course_chapters FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own chapters insert" ON public.course_chapters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chapters update" ON public.course_chapters FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own chapters delete" ON public.course_chapters FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX course_chapters_subject_idx ON public.course_chapters(subject_id, position);
CREATE TRIGGER handle_course_chapters_updated_at BEFORE UPDATE ON public.course_chapters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tasks ADD COLUMN reminder_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.tasks ADD COLUMN reminder_sent_at timestamptz;
CREATE INDEX tasks_reminder_idx ON public.tasks(due_date) WHERE status = 'todo' AND reminder_sent_at IS NULL;