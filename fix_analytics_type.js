const fs = require('fs');
let content = fs.readFileSync('lib/analytics.ts', 'utf8');

content = content.replace(
  /channel\.subscribe\(async \(status\) => \{/g,
  `channel.subscribe(async (status: string) => {`
);

fs.writeFileSync('lib/analytics.ts', content);
console.log("Analytics type fixed");
