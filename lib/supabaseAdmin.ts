import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey, sanitizeSupabaseKey } from './supabase';

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServiceKey = sanitizeSupabaseKey(rawServiceKey, supabaseAnonKey);

// Admin client should only be used in server-side context (e.g. API routes, Server Components)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

