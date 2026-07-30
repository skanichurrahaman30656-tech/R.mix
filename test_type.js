const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('posts').select('media_url').limit(1);
  console.log("Type:", typeof data[0].media_url);
  console.log("Is array:", Array.isArray(data[0].media_url));
  console.log("Value:", data[0].media_url);
}
run();
