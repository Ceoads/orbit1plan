REVOKE ALL ON public.learning_activity_keys FROM anon,authenticated;
REVOKE ALL ON public.learning_rate_events FROM anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.learning_paths,public.learning_concepts,public.learning_activities,public.learning_attempts,public.learning_sessions FROM anon,authenticated;
REVOKE SELECT ON public.learning_paths,public.learning_concepts,public.learning_activities,public.learning_attempts,public.learning_sessions FROM anon;
COMMENT ON TABLE public.learning_activity_keys IS 'Server-only correct answers; never accessible to student clients.';
COMMENT ON TABLE public.learning_concepts IS 'Version-one weighted evidence heuristic; mastery is not an exam-performance guarantee.';