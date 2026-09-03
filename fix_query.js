const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

code = code.replace(
  'saved_posts ( user_id ),\n        post_views ( user_id )',
  'saved_posts ( user_id )'
);
// just in case it was written differently
code = code.replace(
  'saved_posts ( user_id ),\n        post_views ( user_id )\n      `)',
  'saved_posts ( user_id )\n      `)'
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
