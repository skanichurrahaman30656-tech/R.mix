const fs = require('fs');
let code = fs.readFileSync('components/VideoPlayer.tsx', 'utf8');

code = code.replace(
  `{/* eslint-disable-next-line @next/next/no-img-element */}\\n               <img src={poster}`,
  `<img src={poster}`
);
// The above regex might fail if it's literal string. Let's just do a simpler replace.
code = code.split("\\n").filter(line => !line.includes("eslint-disable-next-line @next/next/no-img-element")).join("\\n");

fs.writeFileSync('components/VideoPlayer.tsx', code);
