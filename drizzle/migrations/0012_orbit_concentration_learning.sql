CREATE TABLE public.learning_paths (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
 title text NOT NULL, sources jsonb NOT NULL DEFAULT '[]', coverage_note text NOT NULL DEFAULT '', exam_date date, duration_minutes integer NOT NULL DEFAULT 20,
 status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,subject_id)
);
GRANT SELECT ON public.learning_paths TO authenticated; GRANT ALL ON public.learning_paths TO service_role;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_paths_owner ON public.learning_paths FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.learning_concepts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
 title text NOT NULL, section text NOT NULL, objective text NOT NULL, source_ids jsonb NOT NULL DEFAULT '[]', position integer NOT NULL,
 evidence_weight numeric NOT NULL DEFAULT 0, earned_weight numeric NOT NULL DEFAULT 0, question_count integer NOT NULL DEFAULT 0,
 application_count integer NOT NULL DEFAULT 0, retention_count integer NOT NULL DEFAULT 0, mastery numeric NOT NULL DEFAULT 0, confidence numeric NOT NULL DEFAULT 0,
 review_at timestamptz, last_practiced_at timestamptz, UNIQUE(path_id,position)
);
GRANT SELECT ON public.learning_concepts TO authenticated; GRANT ALL ON public.learning_concepts TO service_role;
ALTER TABLE public.learning_concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_concepts_owner ON public.learning_concepts FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.learning_activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
 concept_id uuid NOT NULL REFERENCES public.learning_concepts(id) ON DELETE CASCADE, title text NOT NULL, kind text NOT NULL,
 content jsonb NOT NULL, position numeric NOT NULL, status text NOT NULL DEFAULT 'ready', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(path_id,position)
);
GRANT SELECT ON public.learning_activities TO authenticated; GRANT ALL ON public.learning_activities TO service_role;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_activities_owner ON public.learning_activities FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.learning_activity_keys (
 activity_id uuid PRIMARY KEY REFERENCES public.learning_activities(id) ON DELETE CASCADE, user_id uuid NOT NULL, answers jsonb NOT NULL
);
GRANT ALL ON public.learning_activity_keys TO service_role;
ALTER TABLE public.learning_activity_keys ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.learning_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, activity_id uuid NOT NULL REFERENCES public.learning_activities(id) ON DELETE CASCADE,
 request_id uuid NOT NULL, responses jsonb NOT NULL, feedback jsonb NOT NULL, correct_count integer NOT NULL, question_count integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,request_id)
);
GRANT SELECT ON public.learning_attempts TO authenticated; GRANT ALL ON public.learning_attempts TO service_role;
ALTER TABLE public.learning_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_attempts_owner ON public.learning_attempts FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.learning_sessions (
 path_id uuid PRIMARY KEY REFERENCES public.learning_paths(id) ON DELETE CASCADE, user_id uuid NOT NULL, activity_id uuid REFERENCES public.learning_activities(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'active', draft jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_sessions TO authenticated; GRANT ALL ON public.learning_sessions TO service_role;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_sessions_owner ON public.learning_sessions FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.learning_rate_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.learning_rate_events TO service_role;
ALTER TABLE public.learning_rate_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX learning_paths_user ON public.learning_paths(user_id);
CREATE INDEX learning_concepts_user_path ON public.learning_concepts(user_id,path_id);
CREATE INDEX learning_activities_user_path ON public.learning_activities(user_id,path_id,position);
CREATE INDEX learning_keys_user ON public.learning_activity_keys(user_id);
CREATE INDEX learning_attempts_user_activity ON public.learning_attempts(user_id,activity_id);
CREATE INDEX learning_sessions_user ON public.learning_sessions(user_id);
CREATE INDEX learning_rate_user_time ON public.learning_rate_events(user_id,created_at);
CREATE FUNCTION public.learning_rate_allowed(p_user uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,18));
 IF (SELECT count(*) FROM public.learning_rate_events WHERE user_id=p_user AND created_at>now()-interval '1 minute')>=10 THEN RETURN false; END IF;
 INSERT INTO public.learning_rate_events(user_id) VALUES(p_user); RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.learning_rate_allowed(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.learning_rate_allowed(uuid) TO service_role;
CREATE FUNCTION public.learning_level(p_mastery numeric,p_confidence numeric,p_application integer,p_retention integer) RETURNS text LANGUAGE sql IMMUTABLE AS $$
 SELECT CASE WHEN p_mastery>=85 AND p_confidence>=0.8 AND p_application>=2 AND p_retention>=1 THEN 'mastered' WHEN p_mastery>=70 AND p_confidence>=0.4 THEN 'strong' WHEN p_mastery>=40 THEN 'developing' ELSE 'practice' END
$$;
REVOKE ALL ON FUNCTION public.learning_level(numeric,numeric,integer,integer) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.learning_level(numeric,numeric,integer,integer) TO service_role;
CREATE FUNCTION public.learning_grade(p_user uuid,p_activity uuid,p_request uuid,p_responses jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.learning_activities; c public.learning_concepts; k jsonb; old_attempt public.learning_attempts; item jsonb; response jsonb; i integer:=0; n integer; correct integer:=0; ok boolean; hints integer; weight numeric; earned numeric:=0; total numeric:=0; fb jsonb:='[]'; applications integer:=0; retentions integer:=0; repeated boolean; new_mastery numeric; new_conf numeric;
BEGIN
 SELECT * INTO a FROM public.learning_activities WHERE id=p_activity AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Activity not found'; END IF;
 SELECT * INTO old_attempt FROM public.learning_attempts WHERE user_id=p_user AND request_id=p_request;
 IF FOUND THEN RETURN jsonb_build_object('feedback',old_attempt.feedback,'correct',old_attempt.correct_count,'total',old_attempt.question_count,'retry',true); END IF;
 IF a.status='completed' THEN RAISE EXCEPTION 'Activity already completed'; END IF;
 SELECT * INTO c FROM public.learning_concepts WHERE id=a.concept_id AND user_id=p_user FOR UPDATE;
 SELECT answers INTO k FROM public.learning_activity_keys WHERE activity_id=a.id AND user_id=p_user;
 n:=jsonb_array_length(coalesce(k,'[]'));
 IF n=0 OR jsonb_array_length(p_responses)<>n THEN RAISE EXCEPTION 'Invalid assessment'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.learning_attempts t JOIN public.learning_activities x ON x.id=t.activity_id WHERE x.concept_id=c.id AND t.user_id=p_user) INTO repeated;
 FOR item IN SELECT value FROM jsonb_array_elements(k) LOOP
  response:=p_responses->i;
  IF NOT (response ? 'selected') OR jsonb_typeof(response->'selected')<>'array' THEN RAISE EXCEPTION 'Invalid answer'; END IF;
  ok:=(SELECT coalesce(jsonb_agg(v ORDER BY v::text),'[]') FROM jsonb_array_elements(response->'selected')v)=(SELECT coalesce(jsonb_agg(v ORDER BY v::text),'[]') FROM jsonb_array_elements(item->'correct')v);
  hints:=least(1,greatest(0,coalesce((response->>'hints')::integer,0)));
  weight:=CASE item->>'difficulty' WHEN 'hard' THEN 1.5 WHEN 'medium' THEN 1.0 ELSE 0.65 END;
  IF repeated AND a.kind<>'review' THEN weight:=weight*0.8; END IF;
  total:=total+weight;
  IF ok THEN correct:=correct+1; earned:=earned+weight*(1-hints*0.3); IF item->>'application'='true' THEN applications:=applications+1; END IF; END IF;
  fb:=fb||jsonb_build_array(jsonb_build_object('correct',ok,'answer',item->'correct','explanation',item->>'explanation'));
  i:=i+1;
 END LOOP;
 IF a.kind='review' AND c.last_practiced_at<now()-interval '1 day' THEN retentions:=CASE WHEN correct::numeric/n>=0.7 THEN 1 ELSE 0 END; END IF;
 new_mastery:=round(100*(c.earned_weight+earned)/(c.evidence_weight+total));
 new_conf:=least(1,(c.question_count+n)::numeric/12);
 INSERT INTO public.learning_attempts(user_id,activity_id,request_id,responses,feedback,correct_count,question_count) VALUES(p_user,a.id,p_request,p_responses,fb,correct,n);
 UPDATE public.learning_concepts SET earned_weight=earned_weight+earned,evidence_weight=evidence_weight+total,question_count=question_count+n,application_count=application_count+applications,retention_count=retention_count+retentions,mastery=new_mastery,confidence=new_conf,last_practiced_at=now(),review_at=now()+CASE WHEN correct::numeric/n<0.7 THEN interval '1 day' WHEN retentions>0 THEN interval '7 days' ELSE interval '3 days' END WHERE id=c.id;
 UPDATE public.learning_activities SET status='completed' WHERE id=a.id;
 UPDATE public.learning_sessions SET draft='{}',updated_at=now() WHERE path_id=a.path_id AND user_id=p_user;
 RETURN jsonb_build_object('feedback',fb,'correct',correct,'total',n,'mastery',new_mastery,'confidence',new_conf,'needsPractice',correct::numeric/n<0.7,'level',public.learning_level(new_mastery,new_conf,c.application_count+applications,c.retention_count+retentions));
END $$;
REVOKE ALL ON FUNCTION public.learning_grade(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.learning_grade(uuid,uuid,uuid,jsonb) TO service_role;
CREATE FUNCTION public.learning_create_path(p_user uuid,p_subject uuid,p_title text,p_sources jsonb,p_note text,p_exam date,p_duration integer,p_units jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pid uuid; cid uuid; aid uuid; u jsonb; position integer:=0;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text||p_subject::text,19));
 SELECT id INTO pid FROM public.learning_paths WHERE user_id=p_user AND subject_id=p_subject;
 IF pid IS NOT NULL THEN RETURN pid; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.subjects WHERE id=p_subject AND user_id=p_user) THEN RAISE EXCEPTION 'Subject not found'; END IF;
 INSERT INTO public.learning_paths(user_id,subject_id,title,sources,coverage_note,exam_date,duration_minutes) VALUES(p_user,p_subject,p_title,p_sources,p_note,p_exam,p_duration) RETURNING id INTO pid;
 FOR u IN SELECT value FROM jsonb_array_elements(p_units) LOOP
  INSERT INTO public.learning_concepts(user_id,path_id,title,section,objective,source_ids,position) VALUES(p_user,pid,u->>'title',u->>'section',u->>'objective',u->'source_ids',position) RETURNING id INTO cid;
  INSERT INTO public.learning_activities(user_id,path_id,concept_id,title,kind,content,position) VALUES(p_user,pid,cid,u->>'title','lesson',jsonb_build_object('lesson',u->>'lesson','questions','[]'::jsonb,'source_ids',u->'source_ids'),position*10) RETURNING id INTO aid;
  INSERT INTO public.learning_activities(user_id,path_id,concept_id,title,kind,content,position) VALUES(p_user,pid,cid,'Vérifier : '||(u->>'title'),'quiz',jsonb_build_object('lesson','','questions',u->'questions','source_ids',u->'source_ids'),position*10+1) RETURNING id INTO aid;
  INSERT INTO public.learning_activity_keys(activity_id,user_id,answers) VALUES(aid,p_user,u->'answers');
  position:=position+1;
 END LOOP;
 INSERT INTO public.learning_sessions(path_id,user_id) VALUES(pid,p_user);
 RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.learning_create_path(uuid,uuid,text,jsonb,text,date,integer,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.learning_create_path(uuid,uuid,text,jsonb,text,date,integer,jsonb) TO service_role;