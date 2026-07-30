const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/rpc/exec_sql');
const apikey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.stories;
  CREATE POLICY "Enable insert for authenticated users only" ON public.stories FOR INSERT WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Enable insert for anon" ON public.stories;
  CREATE POLICY "Enable insert for anon" ON public.stories FOR INSERT WITH CHECK (true);
`;

fetch(url, {
  method: 'POST',
  headers: {
    'apikey': apikey,
    'Authorization': 'Bearer ' + apikey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ sql })
}).then(res => res.text()).then(console.log).catch(console.error);
