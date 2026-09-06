const fs = require('fs');

let content = fs.readFileSync('components/feed/FeedPage.tsx', 'utf8');

// replace isFeedMuted
content = content.replace(/muted=\{isFeedMuted\}/g, 'muted={false}');

// remove button
content = content.replace(/\{\/\* Mute Toggle Button \*\/\}\s*<button[\s\S]*?<\/button>/g, '');

fs.writeFileSync('components/feed/FeedPage.tsx', content);
console.log("Fixed FeedPage mute button");
