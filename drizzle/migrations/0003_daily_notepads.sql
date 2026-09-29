CREATE TABLE public.daily_notepads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cycle_date date NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cycle_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_notepads TO authenticated;
GRANT ALL ON public.daily_notepads TO service_role;
ALTER TABLE public.daily_notepads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notepads select" ON public.daily_notepads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notepads insert" ON public.daily_notepads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notepads update" ON public.daily_notepads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notepads delete" ON public.daily_notepads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER handle_daily_notepads_updated_at BEFORE UPDATE ON public.daily_notepads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_notepads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;