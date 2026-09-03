export const trackView = async (supabase: any, type: string, id: string, userId?: string) => {
  if (typeof window === 'undefined') return;

  const sessionKey = `viewed_${type}_${id}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, 'true');

  try {
    if (userId) {
      // We try to insert unique reach (this will fail silently if they already viewed, due to RLS or unique constraint)
      await supabase.from('post_views').insert({ post_id: id, user_id: userId });
    }

    // In R.mix, reels and videos in the feed are stored in the posts table
    // We attempt to increment in the posts table first for all of them.
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
