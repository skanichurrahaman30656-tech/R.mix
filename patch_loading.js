const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Find: else setLoading(true); inside fetchPosts
code = code.replace(
  "    if (isLoadMore) setIsLoadingMore(true);\n    else setLoading(true);",
  "    if (isLoadMore) setIsLoadingMore(true);\n    else if (posts.length === 0) setLoading(true);"
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
