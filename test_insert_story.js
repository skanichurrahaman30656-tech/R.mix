const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('stories').insert({
    user_id: 'fe3f7a94-a0a3-4b5c-a259-3c28c905670b',
    media_url: 'test',
    type: 'video'
  });
  console.log("Insert result:", error);
}
run();
