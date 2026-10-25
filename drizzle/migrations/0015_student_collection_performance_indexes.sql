CREATE INDEX IF NOT EXISTS idx_flashcards_user_created ON public.flashcards(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subjects_user_name ON public.subjects(user_id, name, id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON public.tasks(user_id, priority_score DESC, id);
CREATE INDEX IF NOT EXISTS idx_notes_vault_user_created ON public.notes_vault(user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_vault_files_user_created ON public.vault_files(user_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date_time ON public.calendar_events(user_id, event_date, start_time, id);