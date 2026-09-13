const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }});
  const data = await res.json();
  const paths = Object.keys(data.paths).filter(p => p.startsWith('/rpc/'));
  console.log("RPCs:", paths);
}
test();
