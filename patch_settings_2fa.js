const fs = require('fs');
let code = fs.readFileSync('components/SettingsSystem.tsx', 'utf8');

const mfaCode = `
        {activeMenu === '2fa' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white">Two-Factor Authentication (TOTP)</div>
              <p className="text-sm text-zinc-400">Enhance your account security by enabling Two-Factor Authentication using an authenticator app.</p>
              
              <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
                <button 
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
                      if (error) throw error;
                      setMfaData(data);
                    } catch (err) {
                      showToast(err.message || 'Failed to enroll MFA');
                    }
                  }}
                  className="bg-indigo-600 text-white rounded px-4 py-2 self-start hover:bg-indigo-500 font-medium"
                >
                  Setup Authenticator App
                </button>
              </div>

              {mfaData && (
                <div className="mt-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col gap-4">
                  <div className="text-sm text-zinc-300">Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</div>
                  <div className="bg-white p-2 rounded-lg self-start" dangerouslySetInnerHTML={{ __html: mfaData.totp.qr_code }} />
                  <div className="text-xs text-zinc-500 font-mono break-all">{mfaData.totp.secret}</div>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <input type="text" id="mfa_code" placeholder="Enter 6-digit code" className="bg-zinc-800 text-white rounded p-2 outline-none max-w-xs" />
                    <button 
                      onClick={async () => {
                        const code = document.getElementById('mfa_code').value;
                        if (!code) return;
                        try {
                          const challenge = await supabase.auth.mfa.challenge({ factorId: mfaData.id });
                          if (challenge.error) throw challenge.error;
                          
                          const verify = await supabase.auth.mfa.verify({
                            factorId: mfaData.id,
                            challengeId: challenge.data.id,
                            code
                          });
                          if (verify.error) throw verify.error;
                          
                          showToast('2FA Successfully Enabled!');
                          setMfaData(null);
                        } catch (err) {
                          showToast(err.message || 'Verification failed');
                        }
                      }}
                      className="bg-green-600 text-white rounded px-4 py-2 self-start hover:bg-green-500 font-medium"
                    >
                      Verify & Enable
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
`;

code = code.replace(
  `{/* Fallback for unconfigured menus */}`,
  mfaCode + `\n        {/* Fallback for unconfigured menus */}`
);

// We need to add state for mfaData
code = code.replace(
  `const [toast, setToast] = useState<string | null>(null);`,
  `const [toast, setToast] = useState<string | null>(null);\n  const [mfaData, setMfaData] = useState<any>(null);`
);

// and update the list of known menus
code = code.replace(
  `!['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email'].includes(activeMenu)`,
  `!['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email', '2fa'].includes(activeMenu)`
);

fs.writeFileSync('components/SettingsSystem.tsx', code);
