export const trackView = async (supabase: any, type: string, id: string, userId?: string) => {
  if (typeof window === 'undefined') return;

  const sessionKey = `viewed_${type}_${id}_${userId || 'anon'}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, 'true');

  try {
    if (userId) {
      const { data, error } = await supabase.from('post_views').insert({ post_id: id, user_id: userId }).select('id');
      if (!error && data && data.length > 0) {
        const channel = supabase.channel('view_sync');
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
      }
    }

    // In R.mix, reels and videos in the feed are stored in the posts table
    // We attempt to increment in the posts table first for all of them.
    await supabase.rpc('increment_post_views', { post_id: id }).catch(() => {});
    
    // Just in case it actually belongs to reels or videos table
    if (type === 'reel') {
      await supabase.rpc('increment_reel_views', { reel_id: id }).catch(() => {});
    } else if (type === 'video') {
      await supabase.rpc('increment_video_views', { video_id: id }).catch(() => {});
    }
    
    await supabase.rpc('increment_daily_views').catch(() => {});
  } catch (err) {
    console.error(`Error tracking view for ${type} ${id}:`, err);
  }
};
