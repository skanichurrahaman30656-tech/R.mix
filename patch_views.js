const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

const regex = /\{\(post\.type === 'video' \|\| post\.type === 'reel'\) && \([\s\S]*?\}\)/;
code = code.replace(regex, '');

fs.writeFileSync('components/MainDashboardClient.tsx', code);
