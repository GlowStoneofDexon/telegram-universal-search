
CREATE TABLE public.bot_admins (
  telegram_id BIGINT PRIMARY KEY,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_admins TO service_role;
ALTER TABLE public.bot_admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_users (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_users TO service_role;
ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_search_log (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT,
  query TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bot_search_log_created ON public.bot_search_log (created_at DESC);
CREATE INDEX idx_bot_search_log_query ON public.bot_search_log (query);
GRANT ALL ON public.bot_search_log TO service_role;
ALTER TABLE public.bot_search_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_featured_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL UNIQUE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_featured_searches TO service_role;
ALTER TABLE public.bot_featured_searches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Sponsored',
  body TEXT NOT NULL,
  url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_ads TO service_role;
ALTER TABLE public.bot_ads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT,
  username TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_reports TO service_role;
ALTER TABLE public.bot_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_forced_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_forced_channels TO service_role;
ALTER TABLE public.bot_forced_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by BIGINT,
  from_chat_id BIGINT,
  message_id BIGINT,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_broadcasts TO service_role;
ALTER TABLE public.bot_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_admin_state (
  telegram_id BIGINT PRIMARY KEY,
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_admin_state TO service_role;
ALTER TABLE public.bot_admin_state ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bot_top_searches(_days INT DEFAULT 30, _limit INT DEFAULT 20)
RETURNS TABLE (query TEXT, hits BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.query, count(*) AS hits
  FROM public.bot_search_log l
  WHERE l.created_at > now() - (_days || ' days')::interval
  GROUP BY l.query
  ORDER BY hits DESC
  LIMIT _limit;
$$;
