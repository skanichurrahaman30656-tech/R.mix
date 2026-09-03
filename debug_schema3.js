const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase.from('post_views').select('*').limit(1);
  if (data && data.length >= 0) {
     // Wait, if it's empty, we can't see the columns from select *
     // But wait! If we do an insert that intentionally fails, or use supabase.rpc?
     console.log('Use REST to get columns:');
  }
}
check();
