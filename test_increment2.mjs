import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: posts } = await supabase.from('posts').select('id, views').limit(5);
  console.log("Posts length:", posts?.length);
  if (posts && posts.length > 0) {
    const post = posts[0];
    console.log("Before views:", post.views);
    const { error } = await supabase.rpc('increment_post_views', { post_id: post.id });
    if (error) console.error("RPC Error:", error);
    else console.log("RPC call success");
    
    const { data: postsAfter } = await supabase.from('posts').select('id, views').eq('id', post.id);
    console.log("After views:", postsAfter[0].views);
  } else {
    console.log("No posts");
  }
}
run();
