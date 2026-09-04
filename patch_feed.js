const fs = require('fs');

let content = fs.readFileSync('components/feed/FeedPage.tsx', 'utf8');

if (!content.includes('import AdUnit')) {
  content = content.replace(
    /import { Lightbox } from '\.\.\/shared\/Lightbox';/,
    `import { Lightbox } from '../shared/Lightbox';\nimport AdUnit from '../shared/AdUnit';`
  );
}

const target = `{posts.map((post: any) => (
              <article key={post.id} className={\`pb-4 border-b last:border-0 \${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'} relative\`}>`;

const replacement = `{posts.map((post: any, index: number) => (
              <React.Fragment key={post.id}>
                {index > 0 && index % 4 === 0 && (
                  <div className={\`pb-4 border-b \${isDarkMode ? 'border-zinc-900' : 'border-zinc-200'} py-4\`}>
                    <AdUnit format="fluid" layoutKey="-gw-1+2a-9x+5c" />
                  </div>
                )}
                <article className={\`pb-4 border-b last:border-0 \${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'} relative\`}>`;

if (content.includes('{posts.map((post: any) => (')) {
  content = content.replace(target, replacement);
  fs.writeFileSync('components/feed/FeedPage.tsx', content);
  console.log("Patched FeedPage.tsx");
} else {
  console.log("Could not find target in FeedPage.tsx");
}
