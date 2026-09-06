const fs = require('fs');

let content = fs.readFileSync('components/settings/SettingsSystem.tsx', 'utf8');

content = content.replace(
  /\{activeMenu === 'help' && \([\s\S]*?<\/ul>\s*<\/div>\s*\)\}/,
  `{activeMenu === 'help' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
             <h3 className="text-white font-semibold mb-2">Help Center</h3>
             <input type="text" id="help_search" placeholder="Search for help..." className="w-full bg-zinc-800 text-white rounded p-2 outline-none mb-4" onChange={(e) => {
               const val = e.target.value.toLowerCase();
               const items = document.querySelectorAll('.help-item');
               items.forEach(item => {
                 if (item.textContent?.toLowerCase().includes(val)) {
                   (item as HTMLElement).style.display = 'block';
                 } else {
                   (item as HTMLElement).style.display = 'none';
                 }
               });
             }} />
             <ul className="space-y-3 text-zinc-300">
                <li className="help-item cursor-pointer hover:text-white transition p-2 bg-zinc-800/50 rounded"><strong>Account & Login</strong><br/><span className="text-xs text-zinc-500">Manage your profile, change username, or reset password.</span></li>
                <li className="help-item cursor-pointer hover:text-white transition p-2 bg-zinc-800/50 rounded"><strong>Privacy & Security</strong><br/><span className="text-xs text-zinc-500">Control who can see your content, block users, and enable 2FA.</span></li>
                <li className="help-item cursor-pointer hover:text-white transition p-2 bg-zinc-800/50 rounded"><strong>Sharing Posts & Reels</strong><br/><span className="text-xs text-zinc-500">How to upload media, set visibility, and manage comments.</span></li>
                <li className="help-item cursor-pointer hover:text-white transition p-2 bg-zinc-800/50 rounded"><strong>Live Streaming</strong><br/><span className="text-xs text-zinc-500">Learn how to start a live broadcast and interact with viewers.</span></li>
             </ul>
          </div>
        )}`
);

fs.writeFileSync('components/settings/SettingsSystem.tsx', content);
console.log("Help fixed.");
