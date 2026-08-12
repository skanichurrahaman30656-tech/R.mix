export const trackView = async (supabase: any, type: string, id: string) => {
  if (typeof window === 'undefined') return;
  const sessionKey = `viewed_${type}_${id}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, 'true');

  try {
    // In R.mix, reels and videos in the feed are stored in the posts table
    // We attempt to increment in the posts table first for all of them.
    // If it's explicitly from reels or videos table, we could use those, 
    // but the UI currently uses the posts table for all feed items.
    await supabase.rpc('increment_post_views', { post_id: id });
    
    // Just in case it actually belongs to reels or videos table
    if (type === 'reel') {
      await supabase.rpc('increment_reel_views', { reel_id: id });
    } else if (type === 'video') {
      await supabase.rpc('increment_video_views', { video_id: id });
    }
    
    await supabase.rpc('increment_daily_views');
  } catch (err) {
    console.error(`Error tracking view for ${type} ${id}:`, err);
  }
};
