const fs = require('fs');

function revert(file) {
  let code = fs.readFileSync(file, 'utf8');
  // Match `(Array.isArray(p.profiles) ? p.profiles[0] : p.profiles)` and replace with `p.profiles`
  // We use a regex that matches `(Array.isArray(VAR.profiles) ? VAR.profiles[0] : VAR.profiles)`
  const regex = /\(Array\.isArray\(([a-zA-Z0-9_]+)\.profiles\) \? \1\.profiles\[0\] : \1\.profiles\)/g;
  code = code.replace(regex, '$1.profiles');
  fs.writeFileSync(file, code);
}

['components/MainDashboardClient.tsx', 'components/reels/ReelCardItem.tsx', 'components/story/StoryViewer.tsx'].forEach(revert);
