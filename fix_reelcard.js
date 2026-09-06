const fs = require('fs');
let content = fs.readFileSync('components/reels/ReelCardItem.tsx', 'utf8');

content = content.replace(
  /\/\/ Record view in live Supabase if user is logged in\s*if \(user\) \{\s*supabase\.from\('post_views'\)\.upsert\(\{\s*post_id: reelItem\.id,\s*user_id: user\.id\s*\}, \{ onConflict: 'post_id,user_id' \}\)\.then\(\(\) => \{\}\);\s*\}/g,
  `// Relying entirely on trackView (2s timer) to insert to post_views and broadcast`
);

fs.writeFileSync('components/reels/ReelCardItem.tsx', content);
console.log("ReelCardItem fixed");
