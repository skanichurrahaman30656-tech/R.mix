const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'skanichurrahaman30656@gmail.com',
    password: 'password123'
  });
  
  const channel = supabase.channel('test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
      console.log("Realtime event received:", payload);
    })
    .subscribe(async (status) => {
      console.log("Sub status:", status);
      if (status === 'SUBSCRIBED') {
        const res = await supabase.from('posts').insert({
          user_id: auth.user.id,
          content: 'realtime test',
          type: 'text'
        });
        console.log("Insert result:", res.error);
      }
    });

  setTimeout(() => { console.log("Exiting"); process.exit(0); }, 5000);
}
run();
