REVOKE EXECUTE ON FUNCTION public.bot_top_searches(INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_top_searches(INT, INT) TO service_role;