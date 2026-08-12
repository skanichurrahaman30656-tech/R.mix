const fs = require('fs');
let content = fs.readFileSync('app/admin/AdminPageClient.tsx', 'utf-8');

content = content.replace(
  /const \[likesCount, setLikesCount\] = useState\(0\);/,
  'const [likesCount, setLikesCount] = useState(0);\n  const [dailyStats, setDailyStats] = useState<any[]>([]);'
);

content = content.replace(
  /const analyticsData = \[\s*\{ name: 'Mon'[\s\S]*?\];/,
  `const analyticsData = dailyStats.length > 0 ? dailyStats.map(s => ({
    name: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
    dau: s.active_users || 0,
    uploads: s.uploads || 0,
    revenue: s.revenue || 0,
    views: s.views || 0
  })) : [
    { name: 'Mon', dau: 0, uploads: 0, revenue: 0, views: 0 }
  ];`
);

content = content.replace(
  /verifyAndLoad\(\);\n  \}, \[router\]\);/,
  `verifyAndLoad();
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    const channel = supabase.channel('admin-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_analytics' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reels' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => fetchAdminData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authorized]);`
);

content = content.replace(
  /const monetizationRes = await supabase.*?\n/,
  `$&      const statsRes = await supabase.from('daily_analytics').select('*').order('date', { ascending: false }).limit(7).then(res => res, () => ({ data: [] }));\n`
);

content = content.replace(
  /if \(monetizationRes\.data\) setMonetizationRequests\(monetizationRes\.data\);\n/,
  `$&      if (statsRes.data) setDailyStats(statsRes.data.reverse());\n`
);

fs.writeFileSync('app/admin/AdminPageClient.tsx', content);
