const fs = require('fs');
let code = fs.readFileSync('components/SettingsSystem.tsx', 'utf8');

code = code.replace(
  `!['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email'].includes(activeMenu)`,
  `activeMenu && !['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email'].includes(activeMenu)`
);

code = code.replace(
  `{activeMenu.replace('_', ' ')}`,
  `{activeMenu?.replace('_', ' ')}`
);

fs.writeFileSync('components/SettingsSystem.tsx', code);
