const fs = require('fs');
let content = fs.readFileSync('app/admin/AdminPageClient.tsx', 'utf-8');

if (!content.includes('dataKey="revenue"')) {
  content = content.replace(
    /<Area type="monotone" dataKey="views" [^\n]+ \/>/,
    '$&\n                      <Area type="monotone" dataKey="revenue" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} name="Revenue" />'
  );
  fs.writeFileSync('app/admin/AdminPageClient.tsx', content);
}
