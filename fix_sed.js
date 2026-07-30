const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

code = code.replace(/    if \(msgErr\) console\.warn\('Message insert failed:', \(msgErr as any\)\?\.message\);\n/g, "");

code = code.replace(/const \{ data, error: msgErr \} = await supabase\.from\('messages'\)\.insert\(\{([\s\S]*?)\}\)\.select\('\*'\)\.single\(\);/g, 
  `const { data, error: msgErr } = await supabase.from('messages').insert({$1}).select('*').single();\n    if (msgErr) console.warn('Message insert failed:', (msgErr as any)?.message);`);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
