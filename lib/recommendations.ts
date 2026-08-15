import { SupabaseClient } from '@supabase/supabase-js';

// Supported content categories
export const RECOMMENDER_CATEGORIES = [
  'General',
  'Technology/AI',
  'Music/Entertainment',
  'Sports/Fitness',
  'Travel/Adventure',
  'Food/Culinary',
  'Comedy/Humor',
  'Gaming',
  'Fashion/Lifestyle'
];

/**
 * Automatically extracts or matches a category based on the post text and tags.
 */
export function extractCategoryFromText(caption: string = ''): string {
  const text = caption.toLowerCase();
  if (text.includes('ai') || text.includes('tech') || text.includes('android') || text.includes('coding') || text.includes('software') || text.includes('app') || text.includes('computer') || text.includes('web') || text.includes('google') || text.includes('chatgpt')) {
    return 'Technology/AI';
  }
  if (text.includes('music') || text.includes('song') || text.includes('dance') || text.includes('singer') || text.includes('entertainment') || text.includes('beat') || text.includes('concert')) {
    return 'Music/Entertainment';
  }
  if (text.includes('gym') || text.includes('fitness') || text.includes('workout') || text.includes('run') || text.includes('sport') || text.includes('football') || text.includes('game') || text.includes('match') || text.includes('play')) {
    return 'Sports/Fitness';
  }
  if (text.includes('travel') || text.includes('trip') || text.includes('beach') || text.includes('adventure') || text.includes('hotel') || text.includes('explore') || text.includes('flight')) {
    return 'Travel/Adventure';
  }
  if (text.includes('food') || text.includes('recipe') || text.includes('cook') || text.includes('eat') || text.includes('restaurant') || text.includes('cafe') || text.includes('chef') || text.includes('baking')) {
    return 'Food/Culinary';
  }
  if (text.includes('funny') || text.includes('joke') || text.includes('laugh') || text.includes('comedy') || text.includes('meme') || text.includes('lol') || text.includes('humor')) {
    return 'Comedy/Humor';
  }
  if (text.includes('gaming') || text.includes('xbox') || text.includes('playstation') || text.includes('ps5') || text.includes('gamer') || text.includes('nintendo') || text.includes('pc gaming')) {
    return 'Gaming';
  }
  if (text.includes('fashion') || text.includes('style') || text.includes('look') || text.includes('makeup') || text.includes('outfit') || text.includes('lifestyle') || text.includes('beauty')) {
    return 'Fashion/Lifestyle';
  }
  return 'General';
}

/**
 * Tracks a real engagement event in Supabase with client-side anti-fraud protections.
 */
export async function trackEngagementEvent(
  supabase: SupabaseClient,
  event: {
    user_id?: string | null;
    post_id: string;
    event_type: string; // 'impression', 'video_start', 'watch_time', 'video_completion', 'replay', 'like', 'comment', 'share', 'save', 'follow_after_view', 'profile_visit_after_view', 'hide', 'report', 'skip', 'video_exit'
    watch_duration?: number;
    percentage_watched?: number;
    session_id?: string;
  }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const { post_id, event_type, watch_duration = 0, percentage_watched = 0, user_id = null } = event;
  const sessionId = event.session_id || sessionStorage.getItem('recommendation_session_id') || 'anon';
  if (sessionId === 'anon' && !event.session_id) {
    const newSessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('recommendation_session_id', newSessionId);
    event.session_id = newSessionId;
  }

  // --- ANTI-FRAUD AND DUPLICATE DETECTION LAYER ---
  const now = Date.now();
  const cacheKey = `rec_evt_${post_id}_${event_type}`;
  const lastRecorded = localStorage.getItem(cacheKey);

  if (lastRecorded) {
    const lastTime = parseInt(lastRecorded, 10);
    // Rate-limit critical engagement events (likes, shares, saves, reports, hides) to once per 5 seconds
    if (['like', 'share', 'save', 'report', 'hide'].includes(event_type) && now - lastTime < 5000) {
      console.warn(`[Anti-Fraud] Blocked rapid repeated ${event_type} event on post ${post_id}`);
      return false;
    }
    // Limit duplicate impressions or start events to once every 1 minute to prevent visual refresh inflating
    if (['impression', 'video_start', 'video_completion'].includes(event_type) && now - lastTime < 60000) {
      return false;
    }
  }

  localStorage.setItem(cacheKey, now.toString());

  try {
    const { error } = await supabase
      .from('recommendation_events')
      .insert({
        user_id: user_id || null,
        post_id,
        event_type,
        watch_duration: Number(watch_duration),
        percentage_watched: Number(percentage_watched),
        session_id: event.session_id || sessionId
      });

    if (error) {
      console.error('Error inserting recommendation event:', error);
      return false;
    }

    // --- PERSONALIZATION LEARNING LOOP ---
    // If user is authenticated, we update their category affinity score
    if (user_id && ['watch_time', 'like', 'comment', 'share', 'save', 'video_completion', 'replay'].includes(event_type)) {
      // 1. Fetch post category
      const { data: postData } = await supabase
        .from('posts')
        .select('category, caption')
        .eq('id', post_id)
        .single();

      if (postData) {
        const category = postData.category || extractCategoryFromText(postData.caption || '');
        
        // Compute affinity delta
        let delta = 0.1; // Default watch-time or engagement bump
        if (event_type === 'like' || event_type === 'save') delta = 0.4;
        if (event_type === 'comment') delta = 0.5;
        if (event_type === 'share') delta = 0.6;
        if (event_type === 'video_completion') delta = 0.5;
        if (event_type === 'replay') delta = 0.8;
        if (event_type === 'skip') delta = -0.3; // Negative feedback reduces affinity

        // Upsert signal score
        const { data: existingSignal } = await supabase
          .from('user_interest_signals')
          .select('score')
          .eq('user_id', user_id)
          .eq('category', category)
          .maybeSingle();

        const currentScore = existingSignal ? Number(existingSignal.score) : 0.0;
        const newScore = Math.max(-5.0, Math.min(10.0, currentScore + delta));

        await supabase
          .from('user_interest_signals')
          .upsert({
            user_id,
            category,
            score: newScore,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,category' });
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to log engagement event:', err);
    return false;
  }
}

/**
 * Fetches the test audience threshold limit settings from Supabase.
 */
export async function getAudienceSettings(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase
      .from('recommendation_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
  }
  return { stage_1_audience_size: 10, stage_2_audience_size: 50, stage_3_audience_size: 250 };
}

/**
 * High-performance, production-grade personalized Recommendation Scoring and Candidate Ranking engine.
 */
export async function rankAndPersonalizePosts(
  supabase: SupabaseClient,
  rawPosts: any[],
  currentUserId: string | null
): Promise<any[]> {
  try {
    // 1. Fetch user category interest scores
    let userInterests: Record<string, number> = {};
    if (currentUserId) {
      const { data: interestData } = await supabase
        .from('user_interest_signals')
        .select('category, score')
        .eq('user_id', currentUserId);

      if (interestData) {
        interestData.forEach((sig) => {
          userInterests[sig.category] = Number(sig.score);
        });
      }
    }

    // 2. Fetch all raw events in the last 48 hours for momentum, watch duration, and velocity calculations
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);

    const { data: recentEvents } = await supabase
      .from('recommendation_events')
      .select('post_id, event_type, watch_duration, percentage_watched, created_at')
      .gt('created_at', cutoffDate.toISOString());

    // 3. Fetch early audience configuration thresholds
    const settings = await getAudienceSettings(supabase);

    // Group events by post
    const postEventsMap: Record<string, any[]> = {};
    if (recentEvents) {
      recentEvents.forEach((evt) => {
        if (!postEventsMap[evt.post_id]) {
          postEventsMap[evt.post_id] = [];
        }
        postEventsMap[evt.post_id].push(evt);
      });
    }

    // 4. Score and filter candidates
    const scoredPosts = rawPosts.map((post) => {
      const category = post.category || extractCategoryFromText(post.content || post.caption || '');
      const events = postEventsMap[post.id] || [];
      const ageHours = Math.max(0.1, (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60));

      // 4.1 Filter blocks, reports, or privacy restrictions
      // If a post has been reported multiple times or hidden by current user, we can suppress it
      const reportsCount = events.filter((e) => e.event_type === 'report').length;
      if (reportsCount >= 3) return null; // Automatic safety filter for viral recommendations

      // 4.2 Compute normalized engagement metrics
      const views = events.filter((e) => ['impression', 'video_start'].includes(e.event_type)).length + 1;
      const watchTimeEvents = events.filter((e) => e.event_type === 'watch_time');
      const totalWatchTime = watchTimeEvents.reduce((sum, e) => sum + Number(e.watch_duration), 0);
      const avgWatchTime = watchTimeEvents.length > 0 ? totalWatchTime / watchTimeEvents.length : 0;
      
      const completions = events.filter((e) => e.event_type === 'video_completion').length;
      const replays = events.filter((e) => e.event_type === 'replay').length;
      const skips = events.filter((e) => e.event_type === 'skip').length;
      const hides = events.filter((e) => e.event_type === 'hide').length;

      const completionRate = completions / views;
      const replayRate = replays / views;

      // Extract raw engagement signals from post metrics or events
      const likesCount = events.filter((e) => e.event_type === 'like').length + (post.likes_count || 0);
      const commentsCount = events.filter((e) => e.event_type === 'comment').length + (post.comments_count || 0);
      const sharesCount = events.filter((e) => e.event_type === 'share').length;
      const savesCount = events.filter((e) => e.event_type === 'save').length;
      const followCount = events.filter((e) => e.event_type === 'follow_after_view').length;

      // 4.3 Normalized Weight Scoring Algorithm (avoids metric domination)
      const watchTimeSignal = Math.min(3.0, avgWatchTime / 15); // max weight 3.0
      const completionSignal = completionRate * 2.5; // max weight 2.5
      const replaySignal = replayRate * 2.0; // max weight 2.0
      const likeSignal = Math.min(1.5, likesCount * 0.1);
      const commentSignal = Math.min(2.0, commentsCount * 0.2);
      const shareSignal = Math.min(2.5, sharesCount * 0.3);
      const saveSignal = Math.min(2.0, savesCount * 0.25);
      const followSignal = Math.min(1.5, followCount * 0.3);

      // Early Test Distribution Stage Management
      // Limit early posts to configurable buckets. If a post doesn't meet performance benchmarks,
      // it scales down. If it performs outstandingly, it propagates to larger stages.
      let audienceReachAllowed = true;
      const totalPostImpressions = events.filter((e) => e.event_type === 'impression').length;

      if (totalPostImpressions < settings.stage_1_audience_size) {
        // Stage 1: Small relevant test audience (Explore state)
        audienceReachAllowed = true; 
      } else if (totalPostImpressions < settings.stage_2_audience_size) {
        // Stage 2: Requires threshold engagement score
        const stage1Score = completionSignal + replaySignal + likeSignal;
        if (stage1Score < 0.5) audienceReachAllowed = false; // Cool down weak engagement
      } else if (totalPostImpressions < settings.stage_3_audience_size) {
        // Stage 3: Requires high engagement velocity
        const stage2Score = completionSignal + replaySignal + likeSignal + shareSignal;
        if (stage2Score < 1.2) audienceReachAllowed = false;
      }

      // New Creator Booster: Give posts from creators with low metrics/follower counts an organic exploration bump
      let creatorExploreBooster = 0.0;
      if (ageHours < 24 && (!post.profiles?.followers_count || post.profiles?.followers_count < 20)) {
        creatorExploreBooster = 1.0; // 1.0 score boost for controlled new-creator discovery
      }

      // 4.4 Virality Momentum Signal (Velocity of Engagement over time)
      const recentEngagementPoints = events.length;
      const engagementVelocity = recentEngagementPoints / ageHours; // events per hour
      const momentumSignal = Math.min(3.0, engagementVelocity * 0.5);

      // Time Decay Gravity: weight older content down
      const timeDecayGravity = 1.5;
      const freshnessSignal = 1.0 / Math.pow(1 + ageHours, timeDecayGravity);

      // Negative feedback signals
      const skipSignal = Math.min(1.5, skips * 0.2);
      const hideSignal = Math.min(2.0, hides * 0.5);
      const reportSignal = Math.min(3.0, reportsCount * 1.0);

      // Personalization Alignment Booster
      const interestAffinity = userInterests[category] || 0.0;
      const personalizationBooster = interestAffinity * 0.4;

      // Master normalized recommendation score formula
      const finalScore = 
        (watchTimeSignal + completionSignal + replaySignal + likeSignal + commentSignal + shareSignal + saveSignal + followSignal)
        * freshnessSignal
        + momentumSignal
        + creatorExploreBooster
        + personalizationBooster
        - skipSignal
        - hideSignal
        - reportSignal;

      return {
        ...post,
        category,
        recommendation_score: Number(finalScore.toFixed(3)),
        metrics: {
          views,
          totalWatchTime,
          avgWatchTime,
          completionRate,
          replayRate,
          likesCount,
          commentsCount,
          sharesCount,
          savesCount,
          reportsCount,
          audienceStage: totalPostImpressions < settings.stage_1_audience_size ? 1 : (totalPostImpressions < settings.stage_2_audience_size ? 2 : 3),
          isSuppressed: !audienceReachAllowed
        }
      };
    }).filter(p => p !== null && !p.metrics.isSuppressed);

    // 5. Sort candidate posts by final calculated recommendation score
    scoredPosts.sort((a: any, b: any) => b.recommendation_score - a.recommendation_score);

    // Feed diversity: prevent the same creator from occupying more than 2 sequential slots
    const diversifiedPosts: any[] = [];
    const creatorCounters: Record<string, number> = {};

    scoredPosts.forEach((post: any) => {
      const creator = post.user_id;
      if (!creatorCounters[creator]) creatorCounters[creator] = 0;

      if (creatorCounters[creator] < 2) {
        diversifiedPosts.push(post);
        creatorCounters[creator]++;
      } else {
        // Push the over-represented creator's content down the list
        scoredPosts.push(post);
      }
    });

    return diversifiedPosts.slice(0, scoredPosts.length);
  } catch (err) {
    console.error('Failed to rank and personalize recommendations:', err);
    return rawPosts; // Safe fallback to raw database array if ranking errors out
  }
}
