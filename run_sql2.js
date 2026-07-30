const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
  console.log("Result:", data, "Error:", error);
}

run("SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';");
