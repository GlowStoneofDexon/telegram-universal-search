CREATE TABLE public.search_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'all',
  limit_count INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  results JSONB,
  error TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.search_jobs TO service_role;
ALTER TABLE public.search_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX search_jobs_pending_idx ON public.search_jobs (status, created_at);

CREATE OR REPLACE FUNCTION public.claim_search_job()
RETURNS SETOF public.search_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.search_jobs j
     SET status = 'running', claimed_at = now()
   WHERE j.id = (
     SELECT s.id FROM public.search_jobs s
      WHERE s.status = 'pending'
        AND s.created_at > now() - interval '2 minutes'
      ORDER BY s.created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
   )
  RETURNING j.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_search_job() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_search_job() TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_search_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE removed INTEGER;
BEGIN
  DELETE FROM public.search_jobs WHERE created_at < now() - interval '1 hour';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_search_jobs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_search_jobs() TO service_role;