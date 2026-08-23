const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grkqbppgimklpyhrvqob.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdya3FicHBnaW1rbHB5aHJ2cW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4ODA3ODUsImV4cCI6MjEwMDQ1Njc4NX0.gP7LoNxsQOWDl-LFMxdO_30chHEcHijFMvzh08kJal4';

async function main() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log(`Fetching OpenAPI schema using serviceKey JWT...`);
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
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
