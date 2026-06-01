import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

// Abort any Supabase request (including token refresh) that hangs > 10s.
// Without this, an expired OAuth session causes the JS client to queue ALL
// database requests behind a token refresh that never completes.
const fetchWithTimeout = (url: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    // Merge any existing signal with our timeout signal
    const signal = init.signal
        ? (() => {
              const merged = new AbortController();
              const abort = () => merged.abort();
              init.signal.addEventListener('abort', abort);
              controller.signal.addEventListener('abort', abort);
              return merged.signal;
          })()
        : controller.signal;
    return fetch(url, { ...init, signal }).finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { fetch: fetchWithTimeout },
});
