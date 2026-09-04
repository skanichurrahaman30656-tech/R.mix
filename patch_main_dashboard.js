const fs = require('fs');

let content = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Add import
if (!content.includes('import AdUnit')) {
  content = content.replace(
    /import \{ StoryViewer \} from '\.\/story\/StoryViewer';/,
    `import { StoryViewer } from './story/StoryViewer';\nimport AdUnit from './shared/AdUnit';`
  );
}

// Replace <main> open
const mainOpenTarget = `<main className="max-w-xl mx-auto py-2">`;
const mainOpenReplacement = `<div className="w-full flex justify-center items-start relative max-w-7xl mx-auto">
        <div className="flex-1 hidden xl:block" />
        <main className="w-full max-w-xl py-2 shrink-0">`;

if (content.includes(mainOpenTarget)) {
  content = content.replace(mainOpenTarget, mainOpenReplacement);
} else {
  console.log("Could not find main tag open");
}

// Replace </main> close
const mainCloseTarget = `      </main>`;
const mainCloseReplacement = `      </main>
        <aside className="hidden xl:block flex-1 pl-8 pt-6 relative">
          <div className="sticky top-20 max-w-[300px]">
            <AdUnit format="rectangle" layoutKey="-gw-1+2a-9x+5c" />
          </div>
        </aside>
      </div>`;

if (content.includes(mainCloseTarget)) {
  content = content.replace(mainCloseTarget, mainCloseReplacement);
} else {
  console.log("Could not find main tag close");
}

fs.writeFileSync('components/MainDashboardClient.tsx', content);
console.log("Patched MainDashboardClient.tsx");
