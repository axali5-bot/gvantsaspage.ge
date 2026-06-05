// Referral capture: a `?ref=CODE` link must survive navigation until the
// visitor signs up, so we stash it in localStorage and read it back at signup.

const REF_KEY = 'avon2flame_ref';

/** Reads `?ref=CODE` from the current URL and stores it (uppercased). Call once on app mount. */
export const captureReferralFromUrl = () => {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref && ref.trim()) {
      localStorage.setItem(REF_KEY, ref.trim().toUpperCase());
    }
  } catch {
    /* SSR / privacy-mode guard — referral is best-effort */
  }
};

export const getStoredReferralCode = (): string | null => {
  try {
    return localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
};

export const clearStoredReferralCode = () => {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    /* ignore */
  }
};
