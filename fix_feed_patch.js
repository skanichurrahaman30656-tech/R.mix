const fs = require('fs');
let content = fs.readFileSync('components/feed/FeedPage.tsx', 'utf8');

// The replacement was:
// {posts.map((post: any, index: number) => (
//               <React.Fragment key={post.id}>
//                 {index > 0 && index % 4 === 0 && ( ... )}
//                 <article ...>

// The closing tag in FeedPage was just </article>. We need it to be </article></React.Fragment>
content = content.replace(/<\/article>\s*\)\)}/g, '</article>\n              </React.Fragment>\n            ))}');

fs.writeFileSync('components/feed/FeedPage.tsx', content);
