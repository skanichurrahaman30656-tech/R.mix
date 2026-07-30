const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const channel = supabase.channel('test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
      console.log("Realtime event received:", payload);
      process.exit(0);
    })
    .subscribe(async (status) => {
      console.log("Sub status:", status);
      if (status === 'SUBSCRIBED') {
        const { error } = await supabase.from('posts').insert({
          user_id: 'fe3f7a94-a0a3-4b5c-a259-3c28c905670b', // dummy
          content: 'realtime test',
          type: 'text'
        });
        console.log("Insert result:", error); // Should be RLS error because no auth, but RLS applies.
      }
    });

  setTimeout(() => { console.log("Timeout"); process.exit(0); }, 5000);
}
run();
