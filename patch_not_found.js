const fs = require('fs');
let content = fs.readFileSync('app/not-found.tsx', 'utf8');
content = "export const dynamic = 'force-dynamic';\n" + content;
fs.writeFileSync('app/not-found.tsx', content);
