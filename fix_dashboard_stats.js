const fs = require('fs');
let content = fs.readFileSync('components/MainDashboardClient.tsx', 'utf8');

// Add state
content = content.replace(
  /const \[user, setUser\] = useState<any>\(null\);/,
  `const [user, setUser] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    totalSaves: 0,
    reach: 0
  });`
);

// Add fetchDashboardStats
content = content.replace(
  /const fetchPosts = async/,
  `const fetchDashboardStats = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, views, user_id, likes(user_id), comments(id), saved_posts(user_id), post_views(user_id)')
        .eq('user_id', uid);
      if (error) throw error;
      
      let tLikes = 0, tComments = 0, tViews = 0, tSaves = 0;
      let reachSet = new Set();
      
      if (data) {
        data.forEach((p: any) => {
          tLikes += (p.likes?.length || 0);
          tComments += (p.comments?.length || 0);
          tViews += (p.views || 0);
          tSaves += (p.saved_posts?.length || 0);
          (p.post_views || []).forEach((v: any) => reachSet.add(v.user_id));
        });
      }
      
      setDashboardStats({
        totalPosts: data ? data.length : 0,
        totalLikes: tLikes,
        totalComments: tComments,
        totalViews: tViews,
        totalSaves: tSaves,
        reach: reachSet.size
      });
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    }
  };
  
  const fetchPosts = async`
);

// Call fetchDashboardStats
content = content.replace(
  /fetchPosts\(uid\);\n\s*fetchStories\(uid\);/,
  `fetchPosts(uid);
      fetchDashboardStats(uid);
      fetchStories(uid);`
);

content = content.replace(
  /fetchPosts\(currentUser\.id\);\n\s*fetchFollowData\(currentUser\.id\);/,
  `fetchPosts(currentUser.id);
          fetchDashboardStats(currentUser.id);
          fetchFollowData(currentUser.id);`
);

// Replace derived state usage
content = content.replace(
  /const totalUserPostsCount = userOwnPosts\.length;\s*const totalUserLikesCount = userOwnPosts\.reduce[\s\S]*?const totalUserSavesCount = userOwnPosts\.reduce[^\n]*\n/,
  `const totalUserPostsCount = dashboardStats.totalPosts;
  const totalUserLikesCount = dashboardStats.totalLikes;
  const totalUserCommentsCount = dashboardStats.totalComments;
  const totalUserViewsCount = dashboardStats.totalViews;
  const estimatedReachCount = dashboardStats.reach;
  const totalUserSavesCount = dashboardStats.totalSaves;
`
);

fs.writeFileSync('components/MainDashboardClient.tsx', content);
console.log("Fixed dashboard stats");
