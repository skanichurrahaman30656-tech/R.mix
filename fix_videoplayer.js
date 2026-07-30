const fs = require('fs');
let code = fs.readFileSync('components/VideoPlayer.tsx', 'utf8');
code = code.replace(
  `controls={controls && !error}`,
  `controls={controls && !error}\n            controlsList="nodownload"`
);
fs.writeFileSync('components/VideoPlayer.tsx', code);
