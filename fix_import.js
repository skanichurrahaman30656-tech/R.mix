const fs = require('fs');
let content = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

if (!content.includes("import AdUnit")) {
  content = content.replace(
    /import \{ ReelCardItem \} from '\.\/reels\/ReelCardItem';/,
    "import { ReelCardItem } from './reels/ReelCardItem';\nimport AdUnit from './shared/AdUnit';"
  );
  fs.writeFileSync('components/MainDashboardClient.tsx', content);
  console.log("Fixed import");
}
