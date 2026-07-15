import { supabase } from '@/lib/supabaseClient';

/**
 * Anonymous visitor counter. A random uuid lives in localStorage (no IP, no
 * personal data) and gets recorded server-side via the record_visit RPC —
 * one row per visitor per day, so unique-visitor counts dedupe themselves.
 *
 * Recorded once per tab session (sessionStorage guard). Admin pages are
 * skipped so the owner working in the dashboard doesn't count as traffic.
 * Fire-and-forget: tracking must never affect the shopping experience.
 */

const VISITOR_KEY = 'av2f_visitor_id';
const SESSION_KEY = 'av2f_visit_recorded';

function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked (private mode etc.) — skip silently
  }
}

export function recordVisit(): void {
  if (window.location.pathname.startsWith('/admin')) return;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
  } catch { /* no sessionStorage — record anyway, server dedupes per day */ }

  const visitorId = getVisitorId();
  if (!visitorId) return;

  supabase.rpc('record_visit', { p_visitor_id: visitorId }).then(({ error }) => {
    if (!error) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
    }
  });
}
