const fs = require('fs');
let content = fs.readFileSync('lib/analytics.ts', 'utf8');

content = content.replace(
  /const sessionKey = \`viewed_\$\{type\}_\$\{id\}\`;/g,
  "const sessionKey = `viewed_${type}_${id}_${userId || 'anon'}`;"
);

fs.writeFileSync('lib/analytics.ts', content);
console.log("Analytics session fixed");
