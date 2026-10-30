CREATE OR REPLACE FUNCTION public.save_semester_setup(_semesters jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid(); _item jsonb; _id uuid; _start date; _end date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_uid::text));
  IF jsonb_typeof(_semesters) IS DISTINCT FROM 'array' OR jsonb_array_length(_semesters) < 2 OR jsonb_array_length(_semesters) > 20 THEN
    RAISE EXCEPTION 'Renseigne au moins deux semestres';
  END IF;
  FOR _item IN SELECT value FROM jsonb_array_elements(_semesters) LOOP
    _start := (_item->>'start_date')::date; _end := (_item->>'end_date')::date;
    IF _start IS NULL OR _end IS NULL OR _end < _start OR length(trim(coalesce(_item->>'name',''))) NOT BETWEEN 1 AND 100 THEN
      RAISE EXCEPTION 'Vérifie le nom et les dates de chaque semestre';
    END IF;
    IF _item->>'id' IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE id = (_item->>'id')::uuid AND user_id = _uid) THEN
      RAISE EXCEPTION 'Semestre introuvable';
    END IF;
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(_semesters) WITH ORDINALITY a(item,n)
    JOIN jsonb_array_elements(_semesters) WITH ORDINALITY b(item,n) ON a.n < b.n
    WHERE (a.item->>'start_date')::date <= (b.item->>'end_date')::date
      AND (b.item->>'start_date')::date <= (a.item->>'end_date')::date
  ) THEN RAISE EXCEPTION 'Les dates des semestres ne doivent pas se chevaucher'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(_semesters) WHERE value->>'id' IS NOT NULL) <>
     (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(_semesters) WHERE value->>'id' IS NOT NULL) THEN
    RAISE EXCEPTION 'Chaque semestre doit être unique';
  END IF;
  FOR _item IN SELECT value FROM jsonb_array_elements(_semesters) LOOP
    _start := (_item->>'start_date')::date; _end := (_item->>'end_date')::date; _id := (_item->>'id')::uuid;
    IF _id IS NULL THEN
      INSERT INTO public.semesters(user_id,name,start_date,end_date,is_current)
      VALUES (_uid,trim(_item->>'name'),_start,_end, (now() AT TIME ZONE 'Europe/Paris')::date BETWEEN _start AND _end);
    ELSE
      UPDATE public.semesters SET name=trim(_item->>'name'),start_date=_start,end_date=_end,
        is_current=(now() AT TIME ZONE 'Europe/Paris')::date BETWEEN _start AND _end
      WHERE id=_id AND user_id=_uid;
    END IF;
  END LOOP;
  UPDATE public.profiles SET preferences = coalesce(preferences,'{}'::jsonb) || jsonb_build_object('semester_dates_done',true) WHERE user_id=_uid;
  -- Drive documents whose semester no longer covers their creation date are re-sorted
  UPDATE public.vault_files v SET semester_id = NULL
  FROM public.semesters s
  WHERE v.user_id=_uid AND s.id=v.semester_id AND 'drive'=ANY(v.tags)
    AND (v.created_at AT TIME ZONE 'Europe/Paris')::date NOT BETWEEN s.start_date AND s.end_date;
  UPDATE public.vault_files v SET semester_id = s.id
  FROM public.semesters s
  WHERE v.user_id=_uid AND s.user_id=_uid AND v.semester_id IS NULL AND 'drive'=ANY(v.tags)
    AND (v.created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN s.start_date AND s.end_date
    AND NOT EXISTS (SELECT 1 FROM public.semesters other WHERE other.user_id=_uid AND other.id<>s.id
      AND (v.created_at AT TIME ZONE 'Europe/Paris')::date BETWEEN other.start_date AND other.end_date);
END; $function$;