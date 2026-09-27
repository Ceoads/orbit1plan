CREATE TABLE public.drive_sync_folders (
  user_id uuid PRIMARY KEY,
  folder_id text NOT NULL,
  folder_name text NOT NULL,
  last_synced_at timestamptz,
  last_imported_count int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drive_sync_folders TO authenticated;
GRANT ALL ON public.drive_sync_folders TO service_role;
ALTER TABLE public.drive_sync_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own drive folder" ON public.drive_sync_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.drive_imported_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  drive_file_id text NOT NULL,
  vault_file_id uuid,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, drive_file_id)
);
GRANT SELECT ON public.drive_imported_files TO authenticated;
GRANT ALL ON public.drive_imported_files TO service_role;
ALTER TABLE public.drive_imported_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own drive imports" ON public.drive_imported_files FOR SELECT TO authenticated USING (auth.uid() = user_id);