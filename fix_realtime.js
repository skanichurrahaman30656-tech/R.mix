const fs = require('fs');
let code = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

const oldRealtime = `.on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts(user.id);
      })`;

const newRealtime = `.on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new && payload.old && payload.new.views !== payload.old.views) {
          // Just update the view count in local state to avoid massive refetches
          setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, views: payload.new.views } : p));
        } else {
          fetchPosts(user.id);
        }
      })`;

code = code.replace(oldRealtime, newRealtime);
fs.writeFileSync('components/MainDashboardClient.tsx', code);
