export const trackView = async (supabase: any, type: string, id: string, userId?: string) => {
  if (typeof window === 'undefined') return;
  const sessionKey = `viewed_${type}_${id}_${userId || 'anon'}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, 'true');
  
  try {
    // Try to insert view into database
    await supabase.from('post_views').insert({ post_id: id, user_id: userId || null });
    
    // Always broadcast real-time view update to UI
    const channel = supabase.channel('dashboard-realtime-channel');
    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'view_increment',
          payload: { post_id: id }
        });
        setTimeout(() => { supabase.removeChannel(channel); }, 1000);
      }
    });
  } catch (err) {
    console.error("Analytics view error:", err);
  }
};
