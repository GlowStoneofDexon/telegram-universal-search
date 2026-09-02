REVOKE EXECUTE ON FUNCTION public.bot_toggle_post_like(UUID, BIGINT) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bot_random_posts(INTEGER) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.bot_toggle_post_like(UUID, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.bot_random_posts(INTEGER) TO service_role;