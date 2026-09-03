const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// 1. Add post_views to fetchPosts
code = code.replace(
  'saved_posts ( user_id )',
  'saved_posts ( user_id ),\n        post_views ( user_id )'
);

// 2. Fix views in fetchPosts mapped object
code = code.replace(
  'views: Array.isArray(p.post_views) ? p.post_views.length : 0,',
  'views: p.views || 0,\n          savesCount: Array.isArray(p.saved_posts) ? p.saved_posts.length : 0,'
);

// 3. Fix engagement calculation
code = code.replace(
  'const userEngagementRate = totalUserViewsCount > 0 ? (((totalUserLikesCount + totalUserCommentsCount) / totalUserViewsCount) * 100).toFixed(1) : "0.0";',
  'const totalUserSavesCount = userOwnPosts.reduce((acc, p) => acc + (p.savesCount || 0), 0);\n  const userEngagementRate = totalUserViewsCount > 0 ? (((totalUserLikesCount + totalUserCommentsCount + totalUserSavesCount) / totalUserViewsCount) * 100).toFixed(1) : "0.0";'
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
