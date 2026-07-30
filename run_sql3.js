const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function run(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  console.log("Result:", data, "Error:", error);
}
run("SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';");
