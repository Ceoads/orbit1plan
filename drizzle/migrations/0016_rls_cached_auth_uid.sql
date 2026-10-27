DO $$
DECLARE p record; q text; w text; s text;
BEGIN
 FOR p IN SELECT tablename, policyname, qual, with_check FROM pg_policies
   WHERE schemaname='public' AND (coalesce(qual,'') ~ 'auth\.uid\(\)' OR coalesce(with_check,'') ~ 'auth\.uid\(\)')
 LOOP
  q := replace(replace(p.qual,'( SELECT auth.uid() AS uid)','__C__'),'auth.uid()','(select auth.uid())');
  q := replace(q,'__C__','( SELECT auth.uid() AS uid)');
  w := replace(replace(p.with_check,'( SELECT auth.uid() AS uid)','__C__'),'auth.uid()','(select auth.uid())');
  w := replace(w,'__C__','( SELECT auth.uid() AS uid)');
  s := format('ALTER POLICY %I ON public.%I', p.policyname, p.tablename);
  IF q IS NOT NULL AND q IS DISTINCT FROM p.qual THEN s := s || ' USING (' || q || ')'; END IF;
  IF w IS NOT NULL AND w IS DISTINCT FROM p.with_check THEN s := s || ' WITH CHECK (' || w || ')'; END IF;
  IF s <> format('ALTER POLICY %I ON public.%I', p.policyname, p.tablename) THEN EXECUTE s; END IF;
 END LOOP;
END $$;