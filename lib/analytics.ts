export const trackView = async (supabase: any, type: string, id: string, userId?: string) => {
  if (typeof window === 'undefined' || !id) return;
  
  try {
    // 1. Resolve active user session if not directly supplied
    let activeUserId = userId;
    let accessToken: string | undefined;

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      activeUserId = activeUserId || sessionData.session.user.id;
      accessToken = sessionData.session.access_token;
    } else {
      // Ensure visitor has an authenticated anonymous session so they have an auth.uid()
      try {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        if (anonData?.session?.user) {
          activeUserId = anonData.session.user.id;
          accessToken = anonData.session.access_token;
        }
      } catch (anonErr) {
        console.warn("Could not initiate anonymous visitor session:", anonErr);
      }
    }

    const sessionKey = `viewed_${type}_${id}_${activeUserId || 'anon'}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, 'true');

    // 2. Insert into post_views using authenticated client with viewer_id (without .select())
    if (activeUserId) {
      const { error } = await supabase
        .from('post_views')
        .insert({ post_id: id, viewer_id: activeUserId });
      if (error && error.code !== '23505') {
        console.warn("Client view insert warning:", error.message);
      }
    }
    
    // 3. Call /api/views to record/fetch latest persisted view count from post_metrics
    let persistedViews: number | undefined;
    try {
      const res = await fetch('/api/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ postId: id, userId: activeUserId || null })
      });
      if (res.ok) {
        const json = await res.json();
        if (typeof json.views === 'number') {
          persistedViews = json.views;
        }
      }
    } catch (apiErr) {
      console.warn("Could not fetch view count from /api/views:", apiErr);
    }
    
    // 4. Broadcast real-time view update to UI with latest persisted view count
    const channel = supabase.channel('dashboard-realtime-channel');
    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'view_increment',
          payload: { post_id: id, views: persistedViews }
        });
        setTimeout(() => { supabase.removeChannel(channel); }, 1000);
      }
    });
  } catch (err) {
    console.error("Analytics view error:", err);
  }
};
