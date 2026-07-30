const fs = require('fs');
let code = fs.readFileSync('components/SettingsSystem.tsx', 'utf8');

// Replace the fallback for password / email
const authActions = `
        {activeMenu === 'password' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white">Change Password</div>
              <input type="password" id="new_pass" placeholder="New Password" className="bg-zinc-800 text-white rounded p-2 outline-none" />
              <button 
                onClick={async () => {
                  const val = document.getElementById('new_pass').value;
                  if (val) {
                    const { error } = await supabase.auth.updateUser({ password: val });
                    if (error) showToast(error.message);
                    else showToast('Password updated');
                  }
                }}
                className="bg-indigo-600 text-white rounded px-4 py-2 mt-2 self-start hover:bg-indigo-500"
              >
                Update
              </button>
            </div>
          </div>
        )}

        {activeMenu === 'email' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white">Change Email</div>
              <input type="email" id="new_email" placeholder="New Email" className="bg-zinc-800 text-white rounded p-2 outline-none" />
              <button 
                onClick={async () => {
                  const val = document.getElementById('new_email').value;
                  if (val) {
                    const { error } = await supabase.auth.updateUser({ email: val });
                    if (error) showToast(error.message);
                    else showToast('Verification link sent to new email');
                  }
                }}
                className="bg-indigo-600 text-white rounded px-4 py-2 mt-2 self-start hover:bg-indigo-500"
              >
                Update
              </button>
            </div>
          </div>
        )}
`;

code = code.replace(
  "{/* Fallback for unconfigured menus */}",
  authActions + "\n        {/* Fallback for unconfigured menus */}"
);

code = code.replace(
  "!['account_privacy', 'story_privacy', 'notifications', 'theme']",
  "!['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email']"
);

fs.writeFileSync('components/SettingsSystem.tsx', code);
