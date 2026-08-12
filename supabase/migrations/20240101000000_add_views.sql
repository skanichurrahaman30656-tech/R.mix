ALTER TABLE posts ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0;
UPDATE posts SET views = 0 WHERE views IS NULL;

ALTER TABLE reels ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0;
UPDATE reels SET views = 0 WHERE views IS NULL;

ALTER TABLE videos ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0;
UPDATE videos SET views = 0 WHERE views IS NULL;

CREATE OR REPLACE FUNCTION increment_post_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts SET views = COALESCE(views, 0) + 1 WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_reel_views(reel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.reels SET views = COALESCE(views, 0) + 1 WHERE id = reel_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_video_views(video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.videos SET views = COALESCE(views, 0) + 1 WHERE id = video_id;
END;
$$;
