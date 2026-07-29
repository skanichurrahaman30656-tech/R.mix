import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://grkqbppgimklpyhrvqob.supabase.co', 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O');
async function test() {
  const r = await supabase.from('story_reactions').select('*').limit(1);
  console.log('reactions:', r.error ? r.error.message : 'exists');
  const rep = await supabase.from('story_replies').select('*').limit(1);
  console.log('replies:', rep.error ? rep.error.message : 'exists');
}
test();
