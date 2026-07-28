import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grkqbppgimklpyhrvqob.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

