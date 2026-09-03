const fs = require('fs');
let code = fs.readFileSync('components/feed/FeedPage.tsx', 'utf8');
code = code.replace(
  /<ViewTracker type=\{post.type === "reel" \? "reel" : post.type === "video" \? "video" : "post"\} id=\{post.id\} \/>/g,
  '<ViewTracker type={post.type === "reel" ? "reel" : post.type === "video" ? "video" : "post"} id={post.id} userId={user?.id} />'
);
fs.writeFileSync('components/feed/FeedPage.tsx', code);
