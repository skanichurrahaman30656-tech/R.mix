const fs = require('fs');

let content = fs.readFileSync('components/live/LivePage.tsx', 'utf8');

content = content.replace(
  /\/\/ Filter out host from viewer count\s*const count = viewersList\.length;\s*setViewerCount\(count\);/,
  `// Filter out host from viewer count
      const filteredViewers = viewersList.filter(v => v.isHost !== true);
      const count = filteredViewers.length;
      setViewerCount(count);`
);

content = content.replace(
  /await channel\.track\(\{\s*username: profile\?\.username \|\| 'user',\s*avatar_url: profile\?\.avatar_url \|\| 'https:\/\/www\.gravatar\.com\/avatar\/\?d=mp',\s*joined_at: new Date\(\)\.toISOString\(\)\s*\}\);/,
  `await channel.track({
          username: profile?.username || 'user',
          avatar_url: profile?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
          joined_at: new Date().toISOString(),
          isHost: hostMode
        });`
);

fs.writeFileSync('components/live/LivePage.tsx', content);
console.log("Fixed Live Presence");
