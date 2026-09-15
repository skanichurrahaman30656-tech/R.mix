import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, userId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Insert into post_views table
    const { data, error } = await supabaseAdmin
      .from('post_views')
      .insert({ post_id: postId })
      .select('id');

    if (error) {
      console.warn('View insert warning:', error.message);
    }

    // Fetch total view count for this post
    const { count, error: countError } = await supabaseAdmin
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const totalViews = count || 0;

    return NextResponse.json({ success: true, views: totalViews });
  } catch (err: any) {
    console.warn('API views error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
