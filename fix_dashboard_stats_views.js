const fs = require('fs');
let content = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// 1. Remove `views,` from select
content = content.replace(
  /\.select\('id, views, user_id, likes\(user_id\), comments\(id\), saved_posts\(user_id\), post_views\(user_id\)'\)/g,
  `.select('id, user_id, likes(user_id), comments(id), saved_posts(user_id), post_views(user_id)')`
);

// 2. Change how tViews is calculated
// Before: tViews += (p.views || 0);
// After: tViews += (Array.isArray(p.post_views) ? p.post_views.length : 0);
content = content.replace(
  /tViews \+= \(p\.views \|\| 0\);/g,
  `tViews += (Array.isArray(p.post_views) ? p.post_views.length : 0);`
);

fs.writeFileSync('components/MainDashboardClient.tsx', content);
console.log("Dashboard stats views fixed");
