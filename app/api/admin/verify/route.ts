import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    if (user.email !== 'skanichurrahaman30656@gmail.com') {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    // Verify role in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Welcome Admin' });
  } catch (err) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
  }
}
