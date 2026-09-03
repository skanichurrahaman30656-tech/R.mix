const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

const oldCode = `  const handleReelTimeUpdate = (reelId: string, currentTime: number) => {
    if (!reelId) return;
    if (currentTime > 3 && !viewedReelIds[reelId]) {
      setViewedReelIds(prev => ({ ...prev, [reelId]: true }));
      supabase.from("post_views").insert({ post_id: reelId, user_id: user?.id }).then((res) => {
        if (res.error) console.warn('Post view insert failed:', (res.error as any)?.message);
      });
      setPosts(prev => prev.map(p => p.id === reelId ? { ...p, views: (p.views || 0) + 1 } : p));
    }
  };`;

const newCode = `  const handleReelTimeUpdate = (reelId: string, currentTime: number) => {
    if (!reelId) return;
    if (currentTime > 3 && !viewedReelIds[reelId]) {
      setViewedReelIds(prev => ({ ...prev, [reelId]: true }));
      setPosts(prev => prev.map(p => p.id === reelId ? { ...p, views: (p.views || 0) + 1 } : p));
    }
  };`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('components/MainDashboardClient.tsx', code);
