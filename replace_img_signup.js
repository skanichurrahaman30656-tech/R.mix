const fs = require('fs');

const file = 'app/signup/page.tsx';
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('import Image from')) {
  content = content.replace('"use client";', '"use client";\nimport Image from "next/image";');
}
content = content.replace(/<img\b/g, '<Image width={500} height={500}');
fs.writeFileSync(file, content);
