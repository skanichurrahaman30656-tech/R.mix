const fs = require('fs');

let content = fs.readFileSync('components/search/SearchPage.tsx', 'utf8');

if (!content.includes('import AdUnit')) {
  content = content.replace(
    /import { Search, Hash, Clock, X, Loader2 } from 'lucide-react';/,
    `import { Search, Hash, Clock, X, Loader2 } from 'lucide-react';\nimport AdUnit from '../shared/AdUnit';`
  );
}

// Below search results:
//             </div>
//           </div>
//         )}
//       </div>
// 
//       {/* Default Explore View (when not searching) */}

content = content.replace(
  `{/* Default Explore View (when not searching) */}`,
  `<div className="my-6">\n          <AdUnit format="fluid" />\n        </div>\n\n      {/* Default Explore View (when not searching) */}`
);

// Between Trending Hashtags and Suggested Creators
content = content.replace(
  `{/* Suggested Discoveries */}`,
  `<div className="my-6">\n            <AdUnit format="fluid" />\n          </div>\n\n          {/* Suggested Discoveries */}`
);

fs.writeFileSync('components/search/SearchPage.tsx', content);
console.log("Patched SearchPage.tsx");
