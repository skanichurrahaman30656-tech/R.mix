-- 7. Verify that user_id is always populated with auth.uid() before inserting.
ALTER TABLE public.posts ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 1, 2, 3. Create an INSERT policy that allows authenticated users to create their own posts. Ensure auth.uid() must equal posts.user_id.
DROP POLICY IF EXISTS "Users can insert their own posts." ON public.posts;
CREATE POLICY "Users can insert their own posts." ON public.posts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Create SELECT policy so public posts are readable.
DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
CREATE POLICY "Posts are viewable by everyone." ON public.posts
FOR SELECT USING (true);

-- 5. Create UPDATE policy so users can edit only their own posts.
DROP POLICY IF EXISTS "Users can update own posts." ON public.posts;
CREATE POLICY "Users can update own posts." ON public.posts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create DELETE policy so users can delete only their own posts.
DROP POLICY IF EXISTS "Users can delete own posts." ON public.posts;
CREATE POLICY "Users can delete own posts." ON public.posts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
