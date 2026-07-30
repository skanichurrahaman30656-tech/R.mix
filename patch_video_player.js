const fs = require('fs');
let code = fs.readFileSync('components/VideoPlayer.tsx', 'utf8');

code = code.replace(
  `!src.startsWith('http') && !src.startsWith('blob:')`,
  `!src.startsWith('http') && !src.startsWith('blob:') && !src.startsWith('data:')`
);

fs.writeFileSync('components/VideoPlayer.tsx', code);
