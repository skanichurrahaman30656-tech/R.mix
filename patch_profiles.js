const fs = require('fs');
const file = 'components/MainDashboardClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      setProfile(data);`;

const replacement = `      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
        
      if (!data && currentUser) {
        const newProfile = {
          id: uid,
          full_name: currentUser.user_metadata?.full_name || 'Member',
          username: currentUser.email ? currentUser.email.split('@')[0] : \`user_\${uid.substring(0,8)}\`,
          avatar_url: currentUser.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'
        };
        try {
          await supabase.from('profiles').insert(newProfile);
          setProfile(newProfile);
        } catch (err) {
          console.error("Failed to restore profile:", err);
          setProfile(null);
        }
      } else {
        setProfile(data);
      }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Patched successfully!");
} else {
  console.log("Target not found!");
}
