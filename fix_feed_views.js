const fs = require('fs');
let code = fs.readFileSync('components/feed/FeedPage.tsx', 'utf8');

const oldStr = '<div className="font-semibold text-sm mb-1">{post.likes.toLocaleString()} likes</div>';
const newStr = '<div className="font-semibold text-sm mb-1 text-zinc-300">\n                    {post.likes.toLocaleString()} likes\n                    {(post.type === "video" || post.type === "reel") && post.views > 0 && ` • ${post.views.toLocaleString()} views`}\n                  </div>';

code = code.replace(oldStr, newStr);
fs.writeFileSync('components/feed/FeedPage.tsx', code);
