const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grkqbppgimklpyhrvqob.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O';

async function main() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log(`Fetching OpenAPI schema from ${url} using anon key v2...`);
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    if (!res.ok) {
      console.error(`Failed to fetch schema: ${res.status} ${res.statusText}`);
      const body = await res.text();
      console.error(body);
      return;
    }
    const data = await res.json();
    console.log('Tables/Views found in schema:');
    if (data.definitions) {
      console.log(Object.keys(data.definitions));
    } else {
      console.log('No definitions field found.');
    }
    console.log('\nPaths/RPCs found in schema:');
    if (data.paths) {
      console.log(Object.keys(data.paths).filter(p => p.startsWith('/rpc/')));
    } else {
      console.log('No paths field found.');
    }
  } catch (err) {
    console.error('Error fetching schema:', err);
  }
}

main();
