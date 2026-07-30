const fs = require('fs');
let code = fs.readFileSync('components/SettingsSystem.tsx', 'utf8');

code = code.replace(
  "{ label: \"Active Login Sessions\", icon: <Smartphone className=\"w-5 h-5\" />, id: 'sessions' },",
  "{ label: \"Email/OTP Verification\", icon: <Smartphone className=\"w-5 h-5\" />, id: 'verification' },"
);

const verificationUi = `
        {activeMenu === 'verification' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white">Email & OTP Verification</div>
              <p className="text-sm text-zinc-400">Configure how you receive One-Time Passwords (OTPs) or verification emails.</p>
              
              <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm font-medium">Primary Email</div>
                    <div className="text-xs text-zinc-500">{user?.email || 'No email configured'}</div>
                  </div>
                  <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">Verified</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
                 <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-medium">Enable Magic Link / OTP Login</div>
                      <div className="text-xs text-zinc-500">Allow login via email code without a password.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                 </div>
              </div>

            </div>
          </div>
        )}
`;

code = code.replace(
  `{/* Fallback for unconfigured menus */}`,
  verificationUi + `\n        {/* Fallback for unconfigured menus */}`
);

code = code.replace(
  `!['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email', '2fa'].includes(activeMenu)`,
  `!['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email', '2fa', 'verification'].includes(activeMenu)`
);

fs.writeFileSync('components/SettingsSystem.tsx', code);
