const fs = require('fs');
let content = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// 1. Fix views mapping
content = content.replace(
  /views: p\.views \|\| 0,/g,
  `views: Array.isArray(p.post_views) ? p.post_views.length : 0,`
);

// 2. Add broadcast channel subscription
// Find real-time setup in useEffect
content = content.replace(
  /\.channel\('dashboard-realtime-channel'\)\n\s*\.on\('postgres_changes', \{ event: '\*', schema: 'public', table: 'posts' \}, \(payload\) => \{/g,
  `.channel('dashboard-realtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {`
);

// We can just add the view_sync channel next to the dashboard-realtime-channel
content = content.replace(
  /const postSubscription = supabase\n\s*\.channel\('dashboard-realtime-channel'\)/g,
  `const viewSyncSubscription = supabase
        .channel('global_view_sync')
        .on('broadcast', { event: 'view_increment' }, (payload) => {
          if (payload.payload && payload.payload.post_id) {
            setPosts(prev => prev.map(p => p.id === payload.payload.post_id ? { ...p, views: (p.views || 0) + 1 } : p));
          }
        })
        .subscribe();

      const postSubscription = supabase
        .channel('dashboard-realtime-channel')`
);

// Also need to unsubscribe from viewSyncSubscription
content = content.replace(
  /supabase\.removeChannel\(postSubscription\);/g,
  `supabase.removeChannel(postSubscription);
      supabase.removeChannel(viewSyncSubscription);`
);

// 3. Remove local optimistic +1 from handleReelTimeUpdate (which is a prop function for ReelsPage)
// Because trackView will now handle everything when IntersectionObserver triggers!
content = content.replace(
  /setPosts\(prev => prev\.map\(p => p\.id === reelId \? \{ \.\.\.p, views: \(p\.views \|\| 0\) \+ 1 \} : p\)\);/g,
  `// Relying on ViewTracker for views, removed optimistic update to prevent double-counting`
);

fs.writeFileSync('components/MainDashboardClient.tsx', content);
console.log("Main fixed");
