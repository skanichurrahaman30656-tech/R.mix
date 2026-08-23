import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grkqbppgimklpyhrvqob.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log('Querying live_sessions table count/columns...');
  const { data: sData, error: sErr } = await supabase.from('live_sessions').select('*').limit(1);
  if (sErr) {
    console.error('Error fetching from live_sessions:', sErr);
  } else {
    console.log('Successfully fetched from live_sessions:', sData);
  }

  console.log('Querying live_comments table count/columns...');
  const { data: cData, error: cErr } = await supabase.from('live_comments').select('*').limit(1);
  if (cErr) {
    console.error('Error fetching from live_comments:', cErr);
  } else {
    console.log('Successfully fetched from live_comments:', cData);
  }
}

main();
