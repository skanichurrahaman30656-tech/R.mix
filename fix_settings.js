const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');
code = code.replace(
  `import { compressImage } from '@/lib/compress';`,
  `import { compressImage } from '@/lib/compress';\nimport { SettingsSystem } from './SettingsSystem';`
);

const parts = code.split(/\{\/\* ==================== VIEW MODE 5: SETTINGS PAGE ==================== \*\/\}/);
if (parts.length === 2) {
  const afterSettings = parts[1].split(/<\/main>/);
  if (afterSettings.length >= 2) {
    const newSettings = `
        {viewMode === 'settings' && (
          <SettingsSystem 
            user={user} 
            onClose={() => setViewMode('profile')} 
            onLogout={handleLogout} 
          />
        )}
      `;
    // Because the old code ended right before </main>
    const tail = afterSettings.slice(1).join('</main>');
    const newCode = parts[0] + 
      "{/* ==================== VIEW MODE 5: SETTINGS PAGE ==================== */}\n" + 
      newSettings + "\n      </main>" + tail;
    
    fs.writeFileSync('components/MainDashboardClient.tsx', newCode);
    console.log("Settings replaced!");
  } else {
    console.log("Could not find </main>");
  }
} else {
  console.log("Could not find Settings Page section");
}
