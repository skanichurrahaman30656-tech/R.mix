const fs = require('fs');
let content = fs.readFileSync('lib/analytics.ts', 'utf8');

content = content.replace(
  /if \(userId\) \{\n\s*\/\/ We try to insert unique reach[^\n]+\n\s*await supabase\.from\('post_views'\)\.insert\(\{ post_id: id, user_id: userId \}\);\n\s*\}/g,
  `if (userId) {
      const { data, error } = await supabase.from('post_views').insert({ post_id: id, user_id: userId }).select('id');
      if (!error && data && data.length > 0) {
        const channel = supabase.channel('view_sync');
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'view_increment',
              payload: { post_id: id }
            });
            setTimeout(() => { supabase.removeChannel(channel); }, 1000);
          }
        });
      }
    }`
);

// Catch errors on the RPCs so they don't break execution if they don't exist
content = content.replace(/await supabase\.rpc\('increment_post_views', \{ post_id: id \}\);/g, "await supabase.rpc('increment_post_views', { post_id: id }).catch(() => {});");
content = content.replace(/await supabase\.rpc\('increment_reel_views', \{ reel_id: id \}\);/g, "await supabase.rpc('increment_reel_views', { reel_id: id }).catch(() => {});");
content = content.replace(/await supabase\.rpc\('increment_video_views', \{ video_id: id \}\);/g, "await supabase.rpc('increment_video_views', { video_id: id }).catch(() => {});");
content = content.replace(/await supabase\.rpc\('increment_daily_views'\);/g, "await supabase.rpc('increment_daily_views').catch(() => {});");

fs.writeFileSync('lib/analytics.ts', content);
console.log("Analytics fixed");
