import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { captureReferralFromUrl, getStoredReferralCode, clearStoredReferralCode } from '@/lib/referral';

export interface ProfileData {
  full_name: string | null;
  phone: string | null;
  default_address: string | null;
  points: number;
  referral_code: string | null;
  referred_by: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  profile: ProfileData | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const fetchProfile = async (uid: string | undefined) => {
    if (!uid) {
      setIsAdmin(false);
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_admin, full_name, phone, default_address, points, referral_code, referred_by')
      .eq('id', uid)
      .maybeSingle();
    setIsAdmin(!!data?.is_admin);
    setProfile(data ? {
      full_name: data.full_name ?? null,
      phone: data.phone ?? null,
      default_address: data.default_address ?? null,
      points: data.points ?? 0,
      referral_code: data.referral_code ?? null,
      referred_by: data.referred_by ?? null,
    } : null);
  };

  const refreshProfile = async () => {
    await fetchProfile(user?.id);
  };

  useEffect(() => {
    let cancelled = false;
    captureReferralFromUrl(); // stash ?ref=CODE before the visitor navigates to signup

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.id) await fetchProfile(session.user.id);
      } catch {
        // Bad/expired session — clear and continue as anonymous
        await supabase.auth.signOut().catch(() => {});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Hard timeout: if session init takes >8s, unblock the app
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    init().then(() => clearTimeout(timeout));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Defer Supabase calls outside the auth callback. The callback runs while
      // GoTrue holds its navigator lock; awaiting another query here deadlocks
      // and stalls EVERY other request (e.g. the products fetch) indefinitely.
      setTimeout(() => {
        const uid = newSession?.user?.id;
        const ref = getStoredReferralCode();
        if (uid && ref) {
          // Attribute a stored ?ref code once signed in (covers Google OAuth signups,
          // where handle_new_user has no referral metadata). RPC is idempotent.
          supabase.rpc('apply_referral', { p_code: ref }).then(
            () => { clearStoredReferralCode(); fetchProfile(uid).catch(() => {}); },
            () => fetchProfile(uid).catch(() => {}),
          );
        } else {
          fetchProfile(uid).catch(() => {});
        }
      }, 0);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const referralCode = getStoredReferralCode();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(referralCode ? { referral_code_used: referralCode } : {}),
        },
      },
    });
    if (!error) clearStoredReferralCode();
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, profile, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
