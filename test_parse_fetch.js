const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(2);
  const formattedPosts = data.map((p) => {
    let mediaList = [];
    if (p.media_url) {
      if (Array.isArray(p.media_url)) {
        mediaList = p.media_url;
      } else if (typeof p.media_url === 'string') {
        try {
          const parsed = JSON.parse(p.media_url);
          if (Array.isArray(parsed)) mediaList = parsed;
          else if (typeof parsed === 'string') mediaList = [parsed];
        } catch {
          mediaList = [p.media_url];
        }
      }
    }
    return {
      id: p.id,
      image: mediaList[0] || null,
      type: p.type
    };
  });
  console.log(JSON.stringify(formattedPosts, null, 2));
}
run();
