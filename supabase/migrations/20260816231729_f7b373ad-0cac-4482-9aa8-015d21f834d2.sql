REVOKE ALL ON FUNCTION public.delete_expired_cache() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_cache_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_cache() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_cache_stats() TO service_role;