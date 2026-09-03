const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase.rpc('increment_post_views', { post_id: '00000000-0000-0000-0000-000000000000' });
  console.log('rpc error:', error);
}
check();
