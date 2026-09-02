CREATE TABLE public.bot_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_settings TO service_role;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  body TEXT NOT NULL,
  link TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_posts TO service_role;
ALTER TABLE public.bot_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bot_post_likes (
  post_id UUID NOT NULL REFERENCES public.bot_posts(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, telegram_id)
);
GRANT ALL ON public.bot_post_likes TO service_role;
ALTER TABLE public.bot_post_likes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bot_toggle_post_like(_post_id UUID, _telegram_id BIGINT)
RETURNS TABLE(liked BOOLEAN, likes INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _exists BOOLEAN;
  _count INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.bot_post_likes WHERE post_id = _post_id AND telegram_id = _telegram_id) INTO _exists;
  IF _exists THEN
    DELETE FROM public.bot_post_likes WHERE post_id = _post_id AND telegram_id = _telegram_id;
  ELSE
    INSERT INTO public.bot_post_likes(post_id, telegram_id) VALUES (_post_id, _telegram_id);
  END IF;
  SELECT COUNT(*) INTO _count FROM public.bot_post_likes WHERE post_id = _post_id;
  UPDATE public.bot_posts SET likes = _count WHERE id = _post_id;
  RETURN QUERY SELECT (NOT _exists), _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.bot_random_posts(_limit INTEGER DEFAULT 1)
RETURNS SETOF public.bot_posts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.bot_posts WHERE is_active ORDER BY random() LIMIT _limit;
$$;