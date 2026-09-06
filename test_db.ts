import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data } = await supabase.from('posts').select('user_id');
  console.log("Total posts:", data?.length);
  const uniqueUsers = new Set(data?.map(d => d.user_id));
  console.log("Unique users:", uniqueUsers.size);
}
run();
