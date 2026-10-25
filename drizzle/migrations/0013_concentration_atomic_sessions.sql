CREATE FUNCTION public.learning_intro_done(p_user uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 UPDATE public.profiles SET preferences=coalesce(preferences,'{}'::jsonb)||'{"concentration_intro_done":true}'::jsonb WHERE user_id=p_user;
$$;
REVOKE ALL ON FUNCTION public.learning_intro_done(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.learning_intro_done(uuid) TO service_role;
CREATE FUNCTION public.learning_save_session(p_user uuid,p_path uuid,p_activity uuid,p_status text,p_responses jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE old public.learning_sessions; merged jsonb:='[]'; r jsonb; idx integer:=0;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.learning_activities WHERE id=p_activity AND path_id=p_path AND user_id=p_user) THEN RAISE EXCEPTION 'Activity not found'; END IF;
 SELECT * INTO old FROM public.learning_sessions WHERE path_id=p_path AND user_id=p_user FOR UPDATE;
 FOR r IN SELECT value FROM jsonb_array_elements(p_responses) LOOP
  merged:=merged||jsonb_build_array(r||jsonb_build_object('hints',greatest(coalesce((r->>'hints')::int,0),CASE WHEN old.activity_id=p_activity THEN coalesce((old.draft->'responses'->idx->>'hints')::int,0) ELSE 0 END))); idx:=idx+1;
 END LOOP;
 INSERT INTO public.learning_sessions(path_id,user_id,activity_id,status,draft) VALUES(p_path,p_user,p_activity,p_status,jsonb_build_object('responses',merged)) ON CONFLICT(path_id) DO UPDATE SET activity_id=excluded.activity_id,status=excluded.status,draft=excluded.draft,updated_at=now();
 IF p_status='skipped' THEN UPDATE public.learning_activities SET status='skipped' WHERE id=p_activity AND user_id=p_user AND status<>'completed'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.learning_save_session(uuid,uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.learning_save_session(uuid,uuid,uuid,text,jsonb) TO service_role;
CREATE FUNCTION public.learning_add_practice(p_user uuid,p_previous uuid,p_content jsonb,p_answers jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.learning_activities; aid uuid; nextpos numeric;
BEGIN
 SELECT * INTO a FROM public.learning_activities WHERE id=p_previous AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Activity not found'; END IF;
 SELECT id INTO aid FROM public.learning_activities WHERE path_id=a.path_id AND concept_id=a.concept_id AND kind='practice' AND position>a.position AND status='ready' ORDER BY position LIMIT 1;
 IF aid IS NOT NULL THEN RETURN aid; END IF;
 SELECT min(position) INTO nextpos FROM public.learning_activities WHERE path_id=a.path_id AND position>a.position;
 nextpos:=CASE WHEN nextpos IS NULL THEN a.position+1 ELSE (a.position+nextpos)/2 END;
 INSERT INTO public.learning_activities(user_id,path_id,concept_id,title,kind,content,position) VALUES(p_user,a.path_id,a.concept_id,'Renforcement ciblé','practice',p_content,nextpos) RETURNING id INTO aid;
 INSERT INTO public.learning_activity_keys(activity_id,user_id,answers) VALUES(aid,p_user,p_answers);
 RETURN aid;
END $$;
REVOKE ALL ON FUNCTION public.learning_add_practice(uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.learning_add_practice(uuid,uuid,jsonb,jsonb) TO service_role;