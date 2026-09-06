import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: posts, error } = await supabase.from('posts').select('id').limit(1);
  if (error) console.error("Select Error:", error);
  if (posts && posts.length > 0) {
    const post = posts[0];
    const { error: rpcError } = await supabase.rpc('increment_post_views', { post_id: post.id });
    console.log("RPC Error:", rpcError);
  }
}
run();
