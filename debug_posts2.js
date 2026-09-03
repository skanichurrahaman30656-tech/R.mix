const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id ( id, username, full_name, avatar_url ),
        likes ( user_id ),
        comments ( id, content, created_at, profiles:user_id ( id, username, avatar_url ) ),
        saved_posts ( user_id ),
        post_views ( user_id )
      `)
      .order('created_at', { ascending: false })
      .range(0, 5);
  console.log('Error:', error);
  console.log('Data length:', data ? data.length : 0);
}
check();
