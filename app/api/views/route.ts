import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grkqbppgimklpyhrvqob.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, userId } = body;

    if (!postId || typeof postId !== 'string') {
      return NextResponse.json({ error: 'Valid postId is required' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Insert into post_views table with viewer_id if userId is present
    if (userId) {
      if (token) {
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: { Authorization: `Bearer ${token}` }
          },
          auth: { persistSession: false }
        });
        const { error: insertError } = await userClient
          .from('post_views')
          .insert({ post_id: postId, viewer_id: userId });

        if (insertError && insertError.code !== '23505') {
          console.warn('View insert warning in /api/views (token client):', insertError.message);
        }
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('post_views')
          .insert({ post_id: postId, viewer_id: userId });

        if (insertError && insertError.code !== '23505') {
          console.warn('View insert warning in /api/views (admin client):', insertError.message);
        }
      }
    }

    // Fetch persisted view metrics for this post from post_metrics
    const { data: metric, error: metricError } = await supabaseAdmin
      .from('post_metrics')
      .select('view_count, reach_count')
      .eq('post_id', postId)
      .maybeSingle();

    if (metricError) {
      console.warn('Post metrics fetch warning:', metricError.message);
    }

    // Also check post_views count as secondary verification
    const { count: rawCount, error: countError } = await supabaseAdmin
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      console.warn('Post views count fetch warning:', countError.message);
    }

    const totalViews = Math.max(Number(metric?.view_count ?? 0), Number(rawCount ?? 0));

    return NextResponse.json({ success: true, views: totalViews });
  } catch (err: any) {
    console.error('API views error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const { data: metric } = await supabaseAdmin
      .from('post_metrics')
      .select('view_count, reach_count')
      .eq('post_id', postId)
      .maybeSingle();

    const { count: rawCount } = await supabaseAdmin
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const totalViews = Math.max(Number(metric?.view_count ?? 0), Number(rawCount ?? 0));

    return NextResponse.json({ success: true, views: totalViews });
  } catch (err: any) {
    console.error('API views GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
