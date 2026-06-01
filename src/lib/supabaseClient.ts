import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

// If the stored access token expired > 1 hour ago, clear it before the client
// initialises. Supabase JS v2 queues ALL DB requests behind a token refresh;
// a long-stale Google OAuth session causes every query to stall forever.
const SESSION_KEY = `sb-rhfzdzipciasljblbmtf-auth-token`;
try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
        const parsed = JSON.parse(raw) as { expires_at?: number } | null;
        const expiresAt = parsed?.expires_at ?? 0;
        const staleSeconds = Math.floor(Date.now() / 1000) - expiresAt;
        if (staleSeconds > 3600) {
            localStorage.removeItem(SESSION_KEY);
        }
    }
} catch { /* localStorage unavailable or JSON malformed — safe to ignore */ }

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
