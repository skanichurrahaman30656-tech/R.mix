import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://grkqbppgimklpyhrvqob.supabase.co', 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O');
async function test() {
  let l = await supabase.from('likes').select('*').limit(1);
  console.log('likes:', Object.keys(l.data[0] || {}));
  let c = await supabase.from('comments').select('*').limit(1);
  console.log('comments:', Object.keys(c.data[0] || {}));
}
test();
