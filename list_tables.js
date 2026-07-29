import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://grkqbppgimklpyhrvqob.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O');
async function test() {
  const { data, error } = await supabase.rpc('get_tables');
  console.log(error || data);
}
test();
