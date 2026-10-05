DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='grades') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='vault_files') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_files;
  END IF;
END $$;