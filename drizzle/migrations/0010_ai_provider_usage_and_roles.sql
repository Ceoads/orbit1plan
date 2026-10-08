DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','moderator','user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE TABLE public.ai_provider_usage (
  provider text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  requests integer NOT NULL DEFAULT 0,
  failures integer NOT NULL DEFAULT 0,
  daily_limit integer NOT NULL DEFAULT 500,
  blocked_until timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, day)
);
GRANT SELECT ON public.ai_provider_usage TO authenticated;
GRANT ALL ON public.ai_provider_usage TO service_role;
ALTER TABLE public.ai_provider_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read AI usage" ON public.ai_provider_usage FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.track_ai_usage(_provider text, _ok boolean, _error text DEFAULT NULL, _block_minutes integer DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.ai_provider_usage(provider, requests, failures, last_error, blocked_until)
  VALUES (_provider, 1, CASE WHEN _ok THEN 0 ELSE 1 END, _error, CASE WHEN _block_minutes > 0 THEN now() + make_interval(mins => _block_minutes) END)
  ON CONFLICT (provider, day) DO UPDATE SET
    requests = ai_provider_usage.requests + 1,
    failures = ai_provider_usage.failures + CASE WHEN _ok THEN 0 ELSE 1 END,
    last_error = COALESCE(_error, ai_provider_usage.last_error),
    blocked_until = CASE WHEN _block_minutes > 0 THEN now() + make_interval(mins => _block_minutes) WHEN _ok THEN NULL ELSE ai_provider_usage.blocked_until END,
    updated_at = now();
END $$;
REVOKE EXECUTE ON FUNCTION public.track_ai_usage(text, boolean, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_ai_usage(text, boolean, text, integer) TO service_role;