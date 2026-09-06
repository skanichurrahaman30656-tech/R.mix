const fs = require('fs');

let content = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

content = content.replace(
  /if \(payload\.eventType === 'UPDATE' && payload\.new && payload\.old && payload\.new\.views !== payload\.old\.views\) \{\s*\/\/[^\n]*\n\s*fetchPosts\(user\.id\);\s*\}/,
  `if (payload.eventType === 'UPDATE' && payload.new && payload.old && payload.new.views !== payload.old.views) {
          setPosts(prevPosts => prevPosts.map(p => 
            p.id === payload.new.id ? { ...p, views: payload.new.views } : p
          ));
          return;
        }`
);

fs.writeFileSync('components/MainDashboardClient.tsx', content);
console.log("Fixed Realtime Views");
