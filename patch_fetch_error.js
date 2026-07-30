const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

code = code.replace(
  `const { data } = await supabase`,
  `const { data, error } = await supabase`
);

code = code.replace(
  `if (data) {`,
  `if (error) console.error('Error fetching posts:', error);
    if (data) {`
);

fs.writeFileSync('components/MainDashboardClient.tsx', code);
