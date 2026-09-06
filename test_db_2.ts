import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data: posts } = await supabase.from('posts').select('id');
  const { data: videos } = await supabase.from('videos').select('id');
  const { data: reels } = await supabase.from('reels').select('id');
  console.log("Posts:", posts?.length);
  console.log("Videos:", videos?.length);
  console.log("Reels:", reels?.length);
}
run();
