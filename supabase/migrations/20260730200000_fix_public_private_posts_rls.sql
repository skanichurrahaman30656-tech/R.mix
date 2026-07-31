-- Fix RLS policies for posts to respect public_account settings and allow public posts to be visible to everyone while keeping private posts hidden.

DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone or followers or owner." ON public.posts;

CREATE POLICY "Posts are viewable by everyone or followers or owner." ON public.posts
FOR SELECT USING (
  auth.uid() = user_id
  OR
  COALESCE(
    (SELECT public_account FROM public.user_settings WHERE user_settings.id = posts.user_id),
    true
  ) = true
  OR
  EXISTS (
    SELECT 1 FROM public.followers
    WHERE followers.following_id = posts.user_id
    AND followers.follower_id = auth.uid()
  )
);

-- Ensure storage policies for media and avatars are public and accessible
DROP POLICY IF EXISTS "Media is publicly accessible." ON storage.objects;
CREATE POLICY "Media is publicly accessible." ON storage.objects 
FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');
