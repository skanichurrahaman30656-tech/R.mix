const fs = require('fs');
let code = fs.readFileSync('components/SettingsSystem.tsx', 'utf8');

code = code.replace(/const \[mfaData, setMfaData\] = useState<any>\(null\);/, `const [mfaData, setMfaData] = useState<any>(null);\n  const [activeFactors, setActiveFactors] = useState<any[]>([]);`);

const fetchMfaLogic = `
  useEffect(() => {
    if (activeMenu === '2fa') {
      supabase.auth.mfa.listFactors().then(({ data }) => {
        if (data) {
          setActiveFactors(data.totp || []);
        }
      });
    }
  }, [activeMenu]);
`;

code = code.replace(/useEffect\(\(\) => \{\n    const fetchSettings = async \(\) => \{/, fetchMfaLogic + `\n  useEffect(() => {\n    const fetchSettings = async () => {`);

const newMfaCode = `
        {activeMenu === '2fa' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white flex items-center justify-between">
                Two-Factor Authentication (TOTP)
                {activeFactors.length > 0 && <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded font-bold">ENABLED</span>}
              </div>
              <p className="text-sm text-zinc-400">Enhance your account security by enabling Two-Factor Authentication using an authenticator app.</p>
              
              {activeFactors.length > 0 ? (
                <div className="border-t border-zinc-800 pt-4 flex flex-col gap-3">
                  <p className="text-sm text-zinc-300">You have active 2FA factors.</p>
                  {activeFactors.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <div className="text-xs text-zinc-400">Factor ID: {f.id.substring(0,8)}...</div>
                      <button 
                        onClick={async () => {
                          const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
                          if (error) {
                            showToast(error.message);
                          } else {
                            showToast('2FA Factor Removed');
                            setActiveFactors(activeFactors.filter(af => af.id !== f.id));
                          }
                        }}
                        className="text-red-500 hover:text-red-400 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
                  <button 
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
                        if (error) throw error;
                        setMfaData(data);
                      } catch (err: any) {
                        showToast(err.message || 'Failed to enroll MFA');
                      }
                    }}
                    className="bg-indigo-600 text-white rounded px-4 py-2 self-start hover:bg-indigo-500 font-medium"
                  >
                    Setup Authenticator App
                  </button>
                </div>
              )}

              {mfaData && !activeFactors.length && (
                <div className="mt-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col gap-4">
                  <div className="text-sm text-zinc-300">Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</div>
                  <div className="bg-white p-2 rounded-lg self-start" dangerouslySetInnerHTML={{ __html: mfaData.totp.qr_code }} />
                  <div className="text-xs text-zinc-500 font-mono break-all">{mfaData.totp.secret}</div>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <input type="text" id="mfa_code" placeholder="Enter 6-digit code" className="bg-zinc-800 text-white rounded p-2 outline-none max-w-xs" />
                    <button 
                      onClick={async () => {
                        const code = (document.getElementById('mfa_code') as HTMLInputElement).value;
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
                          setActiveFactors([...activeFactors, mfaData]);
                        } catch (err: any) {
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

code = code.replace(/\{activeMenu === '2fa' && \([\s\S]*?Setup Authenticator App[\s\S]*?Verify & Enable\n[\s\S]*?<\/button>\n                  <\/div>\n                <\/div>\n              \)}\n            <\/div>\n          <\/div>\n        \)}/, newMfaCode);

fs.writeFileSync('components/SettingsSystem.tsx', code);
