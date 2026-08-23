const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grkqbppgimklpyhrvqob.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is missing!');
  process.exit(1);
}

async function main() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log(`Fetching OpenAPI schema from ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
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
