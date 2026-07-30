const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(2);
  console.log("Latest posts:", JSON.stringify(data, null, 2));
}
run();
