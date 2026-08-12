CREATE TABLE IF NOT EXISTS public.daily_analytics (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  views BIGINT DEFAULT 0,
  uploads BIGINT DEFAULT 0,
  active_users BIGINT DEFAULT 0,
  revenue BIGINT DEFAULT 0
);
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read daily_analytics" ON public.daily_analytics FOR SELECT USING (true);

-- Function to increment daily views
CREATE OR REPLACE FUNCTION increment_daily_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.daily_analytics (date, views)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (date) DO UPDATE
  SET views = daily_analytics.views + 1;
END;
$$;

-- Triggers for daily uploads
CREATE OR REPLACE FUNCTION increment_daily_uploads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.daily_analytics (date, uploads)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (date) DO UPDATE
  SET uploads = daily_analytics.uploads + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE increment_daily_uploads();

CREATE TRIGGER on_reel_created
  AFTER INSERT ON public.reels
  FOR EACH ROW EXECUTE PROCEDURE increment_daily_uploads();

CREATE TRIGGER on_video_created
  AFTER INSERT ON public.videos
  FOR EACH ROW EXECUTE PROCEDURE increment_daily_uploads();
