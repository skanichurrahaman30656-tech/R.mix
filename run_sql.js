const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  console.log("Result:", data, "Error:", error);
}

run("SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';");
