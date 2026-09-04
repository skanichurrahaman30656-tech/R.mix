const fs = require('fs');

let content = fs.readFileSync('components/reels/ReelsPage.tsx', 'utf8');

if (!content.includes('import AdUnit')) {
  content = content.replace(
    /import { ReelCardItem } from '\.\/ReelCardItem';/,
    `import { ReelCardItem } from './ReelCardItem';\nimport AdUnit from '../shared/AdUnit';`
  );
}

const target = `reelsFeed.map((reelItem: any) => (
          <ReelCardItem 
             key={reelItem.id}`;

const replacement = `reelsFeed.map((reelItem: any, index: number) => (
          <React.Fragment key={reelItem.id}>
            <ReelCardItem 
              reelItem={reelItem}`;

// Need to match exactly what's there
let pattern = /reelsFeed\.map\(\(reelItem: any\) => \(\s*<ReelCardItem\s*key=\{reelItem\.id\}/;
if (pattern.test(content)) {
  content = content.replace(pattern, `reelsFeed.map((reelItem: any, index: number) => (
          <React.Fragment key={reelItem.id}>
            <ReelCardItem `);

  // Now replace the closing tag of ReelCardItem to include the AdUnit
  let closingPattern = /setShowCreatePost=\{setShowCreatePost\}\s*\/>\s*\)\)/;
  content = content.replace(closingPattern, `setShowCreatePost={setShowCreatePost}
            />
            {/* Insert advertisement naturally after every 2 or 3 reels */}
            {(index + 1) % 3 === 0 && (
              <div className="w-full h-full min-h-[calc(100vh-3.5rem-4rem)] flex flex-col items-center justify-center snap-start snap-always relative bg-zinc-950 border-b border-zinc-900">
                <span className="text-xs text-zinc-500 uppercase tracking-widest block mb-4">Advertisement</span>
                <AdUnit format="fluid" layoutKey="-gw-1+2a-9x+5c" className="w-full max-w-sm" />
              </div>
            )}
          </React.Fragment>
        ))`);
  fs.writeFileSync('components/reels/ReelsPage.tsx', content);
  console.log("Patched ReelsPage.tsx");
} else {
  console.log("Could not match reelsFeed.map in ReelsPage.tsx");
}
