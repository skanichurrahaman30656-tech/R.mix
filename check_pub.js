const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: "SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';" });
  console.log(data, error);
}
run();
