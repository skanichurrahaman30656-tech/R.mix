import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://grkqbppgimklpyhrvqob.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_gq-z20iCbR83jVFbOiwWzw_k-U8yx9O';

export function sanitizeSupabaseUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return DEFAULT_SUPABASE_URL;
  const clean = url.trim().replace(/^["']|["']$/g, '').trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) return DEFAULT_SUPABASE_URL;
  return clean;
}

export function sanitizeSupabaseKey(key?: string | null, fallback = DEFAULT_SUPABASE_ANON_KEY): string {
  if (!key || typeof key !== 'string') return fallback;
  const clean = key.trim().replace(/^["']|["']$/g, '').trim();
  // Check for non-ASCII (e.g. \u2022 bullet characters from masked UI input), asterisk masks, or invalid short length
  if (/[^\x20-\x7E]/.test(clean) || clean.includes('•') || clean.includes('*') || clean.length < 20) {
    return fallback;
  }
  return clean;
}

export const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    fetch: (url, init) => {
      return fetch(url, { ...init, cache: 'no-store' });
    },
  },
});

