const fs = require('fs');
let content = fs.readFileSync('app/layout.tsx', 'utf8');
content = "export const dynamic = 'force-dynamic';\n" + content;
fs.writeFileSync('app/layout.tsx', content);
