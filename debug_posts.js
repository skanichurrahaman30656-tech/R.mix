const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.example', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (!key && line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);
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
      .range(0, 9);
  console.log('Error:', error);
  console.log('Data length:', data ? data.length : 0);
}
check();
