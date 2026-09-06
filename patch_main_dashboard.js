const fs = require('fs');

let content = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Replace SettingsSystem props
content = content.replace(
  /<SettingsSystem \s*user=\{user\} \s*onClose=\{\(\) => setViewMode\('profile'\)\} \s*onLogout=\{handleLogout\} \s*\/>/m,
  `<SettingsSystem 
            user={user} 
            onClose={() => setViewMode('profile')} 
            onLogout={handleLogout} 
            onEditProfile={() => setShowEditProfile(true)}
          />`
);

fs.writeFileSync('components/MainDashboardClient.tsx', content);
console.log("Patched MainDashboardClient.tsx");
