import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: posts } = await supabase.from('posts').select('id, user_id, type');
  
  const groups = {};
  for(const p of (posts||[])) {
      if(!groups[p.user_id]) groups[p.user_id] = 0;
      groups[p.user_id]++;
  }
  console.log("Users and post counts:");
  console.dir(groups);
  
}
run();
