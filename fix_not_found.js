const fs = require('fs');
let code = fs.readFileSync('app/not-found.tsx', 'utf8');
if (!code.includes('"use client"') && !code.includes("'use client'")) {
  code = '"use client";\n' + code;
  fs.writeFileSync('app/not-found.tsx', code);
}
