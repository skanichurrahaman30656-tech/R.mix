const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

code = code.replace(
  `onPostCreated={() => {
            if (user) fetchPosts(user.id);
          }}`,
  `onPostCreated={() => {
            if (user) fetchPosts(user.id, 0, false, true);
          }}`
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
