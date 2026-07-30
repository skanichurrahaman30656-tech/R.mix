const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

code = code.replace(
  `const fetchPosts = async (userId?: string, pageIndex = page, isLoadMore = false) => {`,
  `const fetchPosts = async (userId?: string, pageIndex = page, isLoadMore = false, forceRefresh = false) => {`
);

code = code.replace(
  `const from = isLoadMore ? pageIndex * POSTS_LIMIT : 0;`,
  `if (forceRefresh) { pageIndex = 0; setPage(0); }
    const from = isLoadMore ? pageIndex * POSTS_LIMIT : 0;`
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
