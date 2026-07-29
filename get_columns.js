import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://grkqbppgimklpyhrvqob.supabase.co', 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O');
async function test() {
  const { data, error } = await supabase.from('stories').select('*').limit(1);
  if (data) console.log(Object.keys(data[0] || {}));
}
test();
