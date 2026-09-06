const fs = require('fs');

let content = fs.readFileSync('components/settings/SettingsSystem.tsx', 'utf8');

content = content.replace(
  /\{activeMenu === 'story_privacy' && \(\s*<div className="space-y-4">/,
  `{activeMenu === 'story_privacy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white capitalize">Story Visibility</div>
              <select 
                className="bg-zinc-800 text-white rounded p-2 outline-none"
                value={settings.story_visibility || 'everyone'}
                onChange={(e) => updateSetting('story_visibility', e.target.value)}
              >
                <option value="everyone">Public</option>
                <option value="followers">Followers</option>
                <option value="none">Only Me</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white capitalize">Reel Visibility</div>
              <select 
                className="bg-zinc-800 text-white rounded p-2 outline-none"
                value={settings.reel_visibility || 'everyone'}
                onChange={(e) => updateSetting('reel_visibility', e.target.value)}
              >
                <option value="everyone">Public</option>
                <option value="followers">Followers</option>
                <option value="none">Only Me</option>
              </select>
            </div>`
);

fs.writeFileSync('components/settings/SettingsSystem.tsx', content);
console.log("Story privacy fixed.");
