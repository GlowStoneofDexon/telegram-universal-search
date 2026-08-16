CREATE TABLE IF NOT EXISTS public.search_cache (
  id BIGSERIAL PRIMARY KEY,
  search_query TEXT NOT NULL,
  category TEXT NOT NULL,
  channel_name TEXT,
  channel_username TEXT,
  message_text TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  content_type TEXT,
  link TEXT,
  message_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days'
);

GRANT ALL ON public.search_cache TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.search_cache_id_seq TO service_role;

ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_search_cache_query ON public.search_cache (search_query, category);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON public.search_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_created ON public.search_cache (created_at DESC);

CREATE OR REPLACE FUNCTION public.delete_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.search_cache WHERE expires_at < now() RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_expired_cache() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_expired_cache() TO service_role;

CREATE OR REPLACE FUNCTION public.get_cache_stats()
RETURNS TABLE(
  total_records BIGINT,
  unique_queries BIGINT,
  oldest_record TIMESTAMPTZ,
  newest_record TIMESTAMPTZ,
  db_size_mb NUMERIC,
  expired_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(DISTINCT search_query)::BIGINT,
    MIN(created_at),
    MAX(created_at),
    (pg_database_size(current_database()) / 1024.0 / 1024.0)::NUMERIC,
    COUNT(*) FILTER (WHERE expires_at < now())::BIGINT
  FROM public.search_cache;
END;
$$;

REVOKE ALL ON FUNCTION public.get_cache_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cache_stats() TO service_role;