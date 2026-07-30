const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://grkqbppgimklpyhrvqob.supabase.co', 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O');

async function test() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log('Buckets:', data?.map(b => b.name));
}
test();
