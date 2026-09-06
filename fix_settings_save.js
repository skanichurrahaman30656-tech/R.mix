const fs = require('fs');

let content = fs.readFileSync('components/settings/SettingsSystem.tsx', 'utf8');

// Replace fetchSettings
content = content.replace(
  /const fetchSettings = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/,
  `const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();
            
      if (error && error.code !== 'PGRST116') throw error;
      
      let merged = { ...settings };
      if (data) {
        merged = { ...merged, ...data };
      }
      if (user?.user_metadata?.app_settings) {
         merged = { ...merged, ...user.user_metadata.app_settings };
      }
      setSettings(merged);
    } catch (err: any) {
      console.warn("Fetch settings fallback:", err.message);
    } finally {
      setLoading(false);
    }
  };`
);

// Replace updateSetting
content = content.replace(
  /const updateSetting = async \(key: string, value: any\) => \{[\s\S]*?finally \{\s*setSaving\(false\);\s*\}\s*\};/,
  `const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    try {
      // Determine if key is supported by user_settings table based on known schema
      const dbKeys = ['username', 'phone_number', 'two_factor_enabled', 'public_account', 'who_can_follow_me', 'who_can_message_me', 'who_can_comment', 'who_can_mention_me', 'who_can_tag_me', 'story_replies', 'allow_emoji_reactions', 'hide_story_from_users', 'story_archive', 'story_auto_delete', 'notification_likes', 'notification_comments', 'notification_replies', 'notification_mentions', 'notification_tags', 'notification_messages', 'notification_calls', 'notification_story_replies', 'notification_reels', 'notification_followers', 'notification_live', 'notification_app_updates', 'language', 'theme'];
      
      if (dbKeys.includes(key)) {
         const { error } = await supabase
          .from('user_settings')
          .upsert({ id: user.id, [key]: value });
         if (error) throw error;
      } else {
         // Save missing columns to auth metadata
         const currentMeta = user.user_metadata?.app_settings || {};
         const { error } = await supabase.auth.updateUser({
           data: { app_settings: { ...currentMeta, [key]: value } }
         });
         if (error) throw error;
      }
      showToast('Settings saved successfully');
    } catch (err: any) {
      console.warn("Save settings error:", err.message);
      showToast('Failed to save settings to cloud, saved locally');
    } finally {
      setSaving(false);
    }
  };`
);

fs.writeFileSync('components/settings/SettingsSystem.tsx', content);
console.log("updateSetting fixed.");
