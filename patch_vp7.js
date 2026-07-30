const fs = require('fs');
let code = fs.readFileSync('components/VideoPlayer.tsx', 'utf8');

code = `/* eslint-disable @next/next/no-img-element */\n` + code;
fs.writeFileSync('components/VideoPlayer.tsx', code);
