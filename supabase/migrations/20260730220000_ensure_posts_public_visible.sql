-- Ensure posts are viewable by everyone without RLS restrictions
DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone or followers or owner." ON public.posts;

CREATE POLICY "Posts are viewable by everyone." ON public.posts
FOR SELECT USING (true);
