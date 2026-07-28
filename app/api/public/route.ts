import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
    
    return NextResponse.json({ data }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500, headers: corsHeaders });
  }
}
