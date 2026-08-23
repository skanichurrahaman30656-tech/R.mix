async function main() {
  const base = 'http://localhost:8000';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const headersOptions = [
    { 'Authorization': `Bearer ${serviceRoleKey}` },
    { 'Authorization': `Bearer ${anonKey}` },
    { 'apikey': serviceRoleKey },
    { 'apikey': anonKey },
    { 'X-API-Key': serviceRoleKey },
    { 'X-API-Key': anonKey }
  ];

  for (let i = 0; i < headersOptions.length; i++) {
    const headers = headersOptions[i];
    try {
      const url = `${base}/api`;
      const res = await fetch(url, { headers });
      console.log(`Headers option ${i}: status=${res.status}`);
      if (res.ok) {
        const body = await res.text();
        console.log(`Success with headers:`, Object.keys(headers), body);
      }
    } catch (err) {
      console.error(`Option ${i} error:`, err.message);
    }
  }
}

main();
