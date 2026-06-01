import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

// Abort any Supabase request that hangs > 10s (prevents token-refresh
// deadlock: Supabase JS v2 queues all DB requests behind a refresh call
// that can hang indefinitely when an OAuth session expires).
const fetchWithTimeout = (url: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10_000);
    return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { fetch: fetchWithTimeout },
});
