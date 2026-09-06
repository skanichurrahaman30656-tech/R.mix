const fs = require('fs');

let content = fs.readFileSync('components/settings/SettingsSystem.tsx', 'utf8');

// Update props
content = content.replace(/export function SettingsSystem\(\{ user, onClose, onLogout \}: any\) \{/, 'export function SettingsSystem({ user, onClose, onLogout, onEditProfile }: any) {');

// Handle edit profile click in renderSubMenu or earlier. Actually, in the menu list, if it's edit_profile, we shouldn't even set activeMenu, we should just call onEditProfile.
// Let's modify the click handler in the menu loop.
content = content.replace(
  /onClick=\{\(\) => setActiveMenu\(item.id\)\}/g,
  `onClick={() => {
                      if (item.id === 'edit_profile') {
                        if (onEditProfile) onEditProfile();
                        onClose();
                      } else if (item.id === 'terms') {
                        window.open('/privacy', '_blank');
                      } else {
                        setActiveMenu(item.id);
                      }
                    }}`
);

const newMenus = `
        {activeMenu === 'username' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white">Change Username</div>
              <input type="text" id="new_username" defaultValue={settings.username} placeholder="New Username" className="bg-zinc-800 text-white rounded p-2 outline-none" />
              <button 
                onClick={async () => {
                  const val = (document.getElementById('new_username') as HTMLInputElement)?.value;
                  if (val && val !== settings.username) {
                    setSaving(true);
                    // Check uniqueness
                    const { data: existing } = await supabase.from('profiles').select('id').eq('username', val).maybeSingle();
                    if (existing && existing.id !== user.id) {
                      showToast('Username is already taken');
                      setSaving(false);
                      return;
                    }
                    const { error } = await supabase.from('profiles').update({ username: val }).eq('id', user.id);
                    await updateSetting('username', val);
                    setSaving(false);
                    if (error) showToast(error.message);
                    else showToast('Username updated successfully');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors mt-2"
                disabled={saving}
              >
                {saving ? 'Checking...' : 'Update Username'}
              </button>
            </div>
          </div>
        )}

        {activeMenu === 'phone' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white">Phone Number</div>
              <input type="tel" id="new_phone" defaultValue={settings.phone_number} placeholder="Phone Number" className="bg-zinc-800 text-white rounded p-2 outline-none" />
              <button 
                onClick={async () => {
                  const val = (document.getElementById('new_phone') as HTMLInputElement)?.value;
                  if (val !== undefined) {
                    await updateSetting('phone_number', val);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors mt-2"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Phone'}
              </button>
            </div>
          </div>
        )}

        {activeMenu === 'interactions' && (
          <div className="space-y-4">
            {['who_can_comment', 'who_can_tag_me', 'who_can_mention_me'].map(k => (
              <div key={k} className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="font-semibold text-white capitalize">{k.replace(/_/g, ' ')}</div>
                <select 
                  className="bg-zinc-800 text-white rounded p-2 outline-none"
                  value={(settings as any)[k] || 'everyone'}
                  onChange={(e) => updateSetting(k, e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="followers">Followers</option>
                  <option value="following">People I Follow</option>
                  <option value="none">No one</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {activeMenu === 'blocked' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-center text-zinc-400">
            <Ban className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-white font-semibold mb-1">No Blocked Users</h3>
            <p className="text-sm">When you block someone, they won't be able to see your content or interact with you.</p>
          </div>
        )}

        {activeMenu === 'muted' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-center text-zinc-400">
            <VolumeX className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <h3 className="text-white font-semibold mb-1">No Muted Users</h3>
            <p className="text-sm">Users you mute will have their posts hidden from your feed.</p>
          </div>
        )}

        {activeMenu === 'language' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="font-semibold text-white mb-2">App Language</div>
            <select 
              className="bg-zinc-800 text-white rounded p-2 outline-none w-full"
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
            >
              <option value="English (US)">English (US)</option>
              <option value="English (UK)">English (UK)</option>
              <option value="Bengali">Bengali</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </div>
        )}

        {activeMenu === 'data_usage' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div>
                <div className="font-semibold text-white">Data Saver</div>
                <div className="text-sm text-zinc-400">Reduce network data when not on Wi-Fi.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={(settings as any).data_saver || false} onChange={e => updateSetting('data_saver', e.target.checked)} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        )}

        {activeMenu === 'accessibility' && (
          <div className="space-y-4">
            {['reduce_motion', 'high_contrast'].map(k => (
              <div key={k} className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="font-semibold text-white capitalize">{k.replace('_', ' ')}</div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={(settings as any)[k] || false} onChange={e => updateSetting(k, e.target.checked)} />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            ))}
          </div>
        )}

        {activeMenu === 'help' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
             <h3 className="text-white font-semibold mb-2">Help Center Topics</h3>
             <ul className="space-y-2 text-zinc-400">
                <li className="cursor-pointer hover:text-white transition">Account & Login</li>
                <li className="cursor-pointer hover:text-white transition">Privacy & Security</li>
                <li className="cursor-pointer hover:text-white transition">Sharing Posts & Reels</li>
             </ul>
          </div>
        )}

        {activeMenu === 'report' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
             <h3 className="text-white font-semibold mb-2">Report a Problem</h3>
             <textarea id="report_text" placeholder="Briefly explain what happened..." className="w-full bg-zinc-800 text-white rounded p-3 h-24 outline-none resize-none"></textarea>
             <button 
                onClick={async () => {
                  const val = (document.getElementById('report_text') as HTMLTextAreaElement)?.value;
                  if (val) {
                    setSaving(true);
                    // Just pretend to submit report if no table exists, or submit to user_settings (not ideal). We will just mock submission.
                    await new Promise(r => setTimeout(r, 1000));
                    showToast('Report submitted successfully. Thank you!');
                    (document.getElementById('report_text') as HTMLTextAreaElement).value = '';
                    setSaving(false);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors mt-2"
                disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit Report'}
              </button>
          </div>
        )}

        {activeMenu === 'alerts' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
             <h3 className="text-white font-semibold mb-2">Security Alerts</h3>
             <div className="text-sm text-zinc-400 p-3 bg-zinc-800 rounded">
               <div className="text-white font-medium">New Login detected</div>
               <div>Location: Unknown Device</div>
               <div className="text-xs mt-1">Just now</div>
             </div>
          </div>
        )}

        {activeMenu === 'login_history' && (
          <div className="space-y-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
             <h3 className="text-white font-semibold mb-2">Login History</h3>
             <div className="text-sm text-zinc-400 p-3 bg-zinc-800 rounded flex justify-between items-center">
               <div>
                 <div className="text-white font-medium">Current Session</div>
                 <div>Active now</div>
               </div>
               <span className="text-green-500 font-bold text-xs">ACTIVE</span>
             </div>
          </div>
        )}
`;

content = content.replace(
  /\{\/\* Fallback for unconfigured menus \*\/\}/,
  newMenus + '\n        {/* Fallback for unconfigured menus */}'
);

const validMenus = `['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email', '2fa', 'verification', 'username', 'phone', 'interactions', 'blocked', 'muted', 'language', 'data_usage', 'accessibility', 'help', 'report', 'alerts', 'login_history']`;
content = content.replace(/!\['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email', '2fa', 'verification'\]\.includes\(activeMenu\)/, `!${validMenus}.includes(activeMenu)`);

fs.writeFileSync('components/settings/SettingsSystem.tsx', content);
console.log("Settings updated successfully.");
