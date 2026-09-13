import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for up to 1 hour, revalidate dynamically

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://r-mix.vercel.app';
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  try {
    // 1. Fetch public posts & reels
    const { data: posts, error: postErr } = await supabaseAdmin
      .from('posts')
      .select('id, type, created_at, updated_at, audience')
      .or('audience.is.null,audience.eq.public')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (!postErr && Array.isArray(posts)) {
      posts.forEach((post) => {
        if (!post?.id) return;
        const lastMod = post.updated_at ? new Date(post.updated_at) : (post.created_at ? new Date(post.created_at) : now);
        routes.push({
          url: `${baseUrl}/post/${post.id}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: post.type === 'reel' || post.type === 'video' ? 0.8 : 0.7,
        });
      });
    }
  } catch (err) {
    console.warn('Error querying posts for sitemap:', err);
  }

  try {
    // 2. Fetch public user profiles
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, username, created_at, updated_at')
      .limit(500);

    if (!profErr && Array.isArray(profiles)) {
      profiles.forEach((prof) => {
        if (!prof?.id) return;
        const lastMod = prof.updated_at ? new Date(prof.updated_at) : (prof.created_at ? new Date(prof.created_at) : now);
        routes.push({
          url: `${baseUrl}/profile/${prof.id}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      });
    }
  } catch (err) {
    console.warn('Error querying profiles for sitemap:', err);
  }

  try {
    // 3. Fetch active public live streams (only currently live)
    const { data: liveSessions, error: liveErr } = await supabaseAdmin
      .from('live_sessions')
      .select('id, created_at, updated_at, status')
      .eq('status', 'live')
      .limit(100);

    if (!liveErr && Array.isArray(liveSessions)) {
      liveSessions.forEach((live) => {
        if (!live?.id) return;
        const lastMod = live.updated_at ? new Date(live.updated_at) : (live.created_at ? new Date(live.created_at) : now);
        routes.push({
          url: `${baseUrl}/live/${live.id}`,
          lastModified: lastMod,
          changeFrequency: 'always',
          priority: 0.9,
        });
      });
    }
  } catch (err) {
    console.warn('Error querying live sessions for sitemap:', err);
  }

  return routes;
}
