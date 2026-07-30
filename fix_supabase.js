const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // 1. Create buckets
  console.log("Creating buckets...");
  await supabase.storage.createBucket('media', { public: true });
  await supabase.storage.createBucket('avatars', { public: true });
  
  // 2. Fix posts RLS
  console.log("Fixing posts table...");
  const sql = `
    -- Enable inserts on posts for all users (or authenticated)
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.posts;
    CREATE POLICY "Enable insert for authenticated users only" ON public.posts FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable insert for anon" ON public.posts;
    CREATE POLICY "Enable insert for anon" ON public.posts FOR INSERT WITH CHECK (true);

    -- Storage policies for media
    CREATE POLICY "public media access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
    CREATE POLICY "public media insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
    
    -- Storage policies for avatars
    CREATE POLICY "public avatars access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    CREATE POLICY "public avatars insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql: sql });
  console.log("RPC result:", error);
}

run();
