async function main() {
  const base = 'http://localhost:8000';
  const paths = [
    '/health',
    '/api',
    '/',
    '/api/migrations',
    '/migrations',
    '/db',
    '/api/db',
    '/api/supabase'
  ];

  for (const path of paths) {
    try {
      const url = `${base}${path}`;
      const res = await fetch(url);
      console.log(`${path}: status=${res.status}`);
      if (res.ok) {
        const body = await res.text();
        console.log(`Body:`, body.substring(0, 200));
      }
    } catch (err) {
      console.error(`${path}: error=`, err.message);
    }
  }
}

main();
