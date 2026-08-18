CREATE TABLE IF NOT EXISTS public.bot_rate_limits (
  telegram_user_id BIGINT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.bot_rate_limits TO service_role;

ALTER TABLE public.bot_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_bot_rate_limit(
  _user_id BIGINT,
  _max_requests INTEGER DEFAULT 12,
  _window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, retry_after INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_rec public.bot_rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.bot_rate_limits AS r (telegram_user_id, window_started_at, request_count, updated_at)
  VALUES (_user_id, now(), 1, now())
  ON CONFLICT (telegram_user_id) DO UPDATE
    SET request_count = CASE
          WHEN r.window_started_at < now() - make_interval(secs => _window_seconds) THEN 1
          ELSE r.request_count + 1
        END,
        window_started_at = CASE
          WHEN r.window_started_at < now() - make_interval(secs => _window_seconds) THEN now()
          ELSE r.window_started_at
        END,
        updated_at = now()
  RETURNING * INTO row_rec;

  RETURN QUERY SELECT
    row_rec.request_count <= _max_requests,
    GREATEST(0, _window_seconds - EXTRACT(EPOCH FROM (now() - row_rec.window_started_at))::INTEGER);
END;
$$;