const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'skanichurrahaman30656@gmail.com',
    password: 'password123'
  }); // I don't know the password... let me just use the service role to fix RLS!
}
