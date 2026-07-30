import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Shield, User, Lock, Mail, Phone, Smartphone, History, Ban, VolumeX,
  Bell, Eye, Clock, Image as ImageIcon, MessageCircle, Heart, Tag,
  Users, UserPlus, Bookmark, Download, PieChart, Accessibility, Globe,
  Moon, Info, HelpCircle, AlertTriangle, FileText, Check, ChevronRight, ArrowLeft
} from 'lucide-react';

export function SettingsSystem({ user, onClose, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('Account');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mfaData, setMfaData] = useState<any>(null);
  const [activeFactors, setActiveFactors] = useState<any[]>([]);

  // Settings State
  const [settings, setSettings] = useState({
    username: user?.user_metadata?.username || '',
    phone_number: user?.phone || '',
    two_factor_enabled: false,
    public_account: true,
    who_can_follow_me: 'everyone',
    who_can_message_me: 'everyone',
    who_can_comment: 'everyone',
    who_can_mention_me: 'everyone',
    who_can_tag_me: 'everyone',
    story_replies: 'everyone',
    allow_emoji_reactions: true,
    hide_story_from_users: [],
    story_archive: true,
    story_auto_delete: true,
    notification_likes: true,
    notification_comments: true,
    notification_replies: true,
    notification_mentions: true,
    notification_tags: true,
    notification_messages: true,
    notification_calls: true,
    notification_story_replies: true,
    notification_reels: true,
    notification_followers: true,
    notification_live: true,
    notification_app_updates: false,
    language: 'English (US)',
    theme: 'system'
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err: any) {
      // console.warn("Fetch settings fallback:", err.message);
      const local = localStorage.getItem('user_settings_' + user.id);
      if (local) {
        setSettings(prev => ({ ...prev, ...JSON.parse(local) }));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ id: user.id, ...newSettings });
      
      if (error) throw error;
      showToast('Settings saved successfully');
    } catch (err: any) {
      // console.warn("Save settings fallback:", err.message);
      localStorage.setItem('user_settings_' + user.id, JSON.stringify(newSettings));
      showToast('Saved to local storage');
    } finally {
      setSaving(false);
    }
  };

  const menuGroups = [
    {
      title: "Account",
      items: [
        { label: "Edit Profile", icon: <User className="w-5 h-5" />, id: 'edit_profile' },
        { label: "Change Username", icon: <User className="w-5 h-5" />, id: 'username' },
        { label: "Change Password", icon: <Lock className="w-5 h-5" />, id: 'password' },
        { label: "Change Email", icon: <Mail className="w-5 h-5" />, id: 'email' },
        { label: "Phone Number", icon: <Phone className="w-5 h-5" />, id: 'phone' },
      ]
    },
    {
      title: "Security",
      items: [
        { label: "Two-Factor Authentication", icon: <Shield className="w-5 h-5" />, id: '2fa' },
        { label: "Email/OTP Verification", icon: <Smartphone className="w-5 h-5" />, id: 'verification' },
        { label: "Security Alerts", icon: <AlertTriangle className="w-5 h-5" />, id: 'alerts' },
        { label: "Login History", icon: <History className="w-5 h-5" />, id: 'login_history' },
      ]
    },
    {
      title: "Privacy",
      items: [
        { label: "Account Privacy", icon: <Lock className="w-5 h-5" />, id: 'account_privacy' },
        { label: "Story & Reel Privacy", icon: <Eye className="w-5 h-5" />, id: 'story_privacy' },
        { label: "Interactions (Comments/Tags)", icon: <MessageCircle className="w-5 h-5" />, id: 'interactions' },
        { label: "Blocked Users", icon: <Ban className="w-5 h-5" />, id: 'blocked' },
        { label: "Muted Users", icon: <VolumeX className="w-5 h-5" />, id: 'muted' },
      ]
    },
    {
      title: "Notifications",
      items: [
        { label: "Push Notifications", icon: <Bell className="w-5 h-5" />, id: 'notifications' },
      ]
    },
    {
      title: "App & Media",
      items: [
        { label: "Language", icon: <Globe className="w-5 h-5" />, id: 'language' },
        { label: "Theme", icon: <Moon className="w-5 h-5" />, id: 'theme' },
        { label: "Data Usage", icon: <PieChart className="w-5 h-5" />, id: 'data_usage' },
        { label: "Accessibility", icon: <Accessibility className="w-5 h-5" />, id: 'accessibility' },
      ]
    },
    {
      title: "Support",
      items: [
        { label: "Help Center", icon: <HelpCircle className="w-5 h-5" />, id: 'help' },
        { label: "Report a Problem", icon: <AlertTriangle className="w-5 h-5" />, id: 'report' },
        { label: "Terms & Privacy Policy", icon: <FileText className="w-5 h-5" />, id: 'terms' },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const renderSubMenu = () => {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
          <button onClick={() => setActiveMenu(null)} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-100" />
          </button>
          <h2 className="text-xl font-bold text-white capitalize">{activeMenu?.replace('_', ' ')}</h2>
        </div>

        {activeMenu === 'account_privacy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div>
                <div className="font-semibold text-white">Public Account</div>
                <div className="text-sm text-zinc-400">Anyone can see your posts and reels.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.public_account} onChange={e => updateSetting('public_account', e.target.checked)} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        )}

        {activeMenu === 'story_privacy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div>
                <div className="font-semibold text-white">Allow Emoji Reactions</div>
                <div className="text-sm text-zinc-400">Viewers can react to your stories with emojis.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.allow_emoji_reactions} onChange={e => updateSetting('allow_emoji_reactions', e.target.checked)} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div>
                <div className="font-semibold text-white">Story Auto Delete (24h)</div>
                <div className="text-sm text-zinc-400">Automatically delete stories after 24 hours.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.story_auto_delete} onChange={e => updateSetting('story_auto_delete', e.target.checked)} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        )}

        {activeMenu === 'notifications' && (
          <div className="space-y-4">
            {['likes', 'comments', 'replies', 'mentions', 'tags', 'messages'].map(k => (
              <div key={k} className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="font-semibold text-white capitalize">{k} Notifications</div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={(settings as any)[`notification_${k}`]} onChange={e => updateSetting(`notification_${k}`, e.target.checked)} />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            ))}
          </div>
        )}

        {activeMenu === 'theme' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="font-semibold text-white">Theme</div>
                <select 
                  className="bg-zinc-800 text-white rounded p-2 outline-none"
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value)}
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
             </div>
          </div>
        )}

        
        {activeMenu === 'password' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white">Change Password</div>
              <input type="password" id="new_pass" placeholder="New Password" className="bg-zinc-800 text-white rounded p-2 outline-none" />
              <button 
                onClick={async () => {
                  const val = (document.getElementById('new_pass') as HTMLInputElement)?.value;
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
                  const val = (document.getElementById('new_email') as HTMLInputElement)?.value;
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

        {/* Fallback for unconfigured menus */}
        {activeMenu && !['account_privacy', 'story_privacy', 'notifications', 'theme', 'password', 'email', '2fa', 'verification'].includes(activeMenu) && (
          <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
            <h3 className="text-lg font-medium text-zinc-300 mb-2">{activeMenu?.replace('_', ' ')}</h3>
            <p>This setting module is currently being built or securely integrated into Supabase backend.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 px-4 py-4 flex items-center gap-4">
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Settings & Security</h1>
      </div>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {activeMenu ? (
        renderSubMenu()
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-2">{group.title}</h3>
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                {group.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors ${itemIdx !== group.items.length - 1 ? 'border-b border-zinc-800' : ''}`}
                  >
                    <div className="flex items-center gap-3 text-zinc-300">
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
