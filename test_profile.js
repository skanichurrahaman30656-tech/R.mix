const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
let url = '', key = '';
for (const line of env) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1];
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1];
}
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
check();
