const fs = require('fs');
let code = fs.readFileSync('lib/supabase.ts', 'utf8');

code = code.replace(
  'export const supabase = createClient(supabaseUrl, supabaseAnonKey);',
  `export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, init) => {
      return fetch(url, { ...init, cache: 'no-store' });
    },
  },
});`
);

fs.writeFileSync('lib/supabase.ts', code);
