const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'skanichurrahaman30656@gmail.com', // from USER_EMAIL metadata
    password: 'password123' // we don't know the password
  });
  console.log("Auth err:", authErr);
  if (auth.user) {
    const { data, error } = await supabase.from('posts').insert({
      user_id: auth.user.id,
      content: 'test',
      media_url: '[]',
      type: 'video'
    });
    console.log("Insert post result:", error);
  }
}
run();
