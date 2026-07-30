const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const channel = supabase.channel('test')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
    console.log("Realtime event received:", payload);
  })
  .subscribe(status => {
    console.log("Sub status:", status);
  });
setTimeout(() => { console.log("Exiting"); process.exit(0); }, 5000);
