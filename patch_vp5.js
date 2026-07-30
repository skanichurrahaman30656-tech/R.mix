const fs = require('fs');
let code = fs.readFileSync('components/VideoPlayer.tsx', 'utf8');

code = code.replace(
  `<img src={poster}`,
  `{/* eslint-disable-next-line @next/next/no-img-element */}\n               <img src={poster}`
);

fs.writeFileSync('components/VideoPlayer.tsx', code);
