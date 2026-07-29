import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('posts').select('*').limit(10);
    
    if (error) {
      return NextResponse.json({ data: [], error: error.message }, { headers: corsHeaders });
    }
    
    return NextResponse.json({ data }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : 'Unknown error' }, { headers: corsHeaders });
  }
}
