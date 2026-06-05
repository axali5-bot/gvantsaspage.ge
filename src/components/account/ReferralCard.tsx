import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Gift, Copy, Check, Users, Sparkles } from 'lucide-react';

/** Loyalty points balance + referral link + invited/qualified stats. Shown on /account. */
export const ReferralCard = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ invited: 0, qualified: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('referrals')
        .select('status')
        .eq('referrer_id', user.id);
      if (data) {
        setStats({
          invited: data.length,
          qualified: data.filter((r) => r.status === 'qualified').length,
        });
      }
    })();
  }, [user]);

  if (!profile) return null;

  const referralLink = `${window.location.origin}/?ref=${profile.referral_code ?? ''}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('ბმული დაკოპირდა! 🌹');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('კოპირება ვერ მოხერხდა');
    }
  };

  return (
    <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-[1.5rem] shadow-sm p-8 space-y-6 text-white">
      {/* Points balance */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-white/90" />
            <h2 className="font-display text-lg">ჩემი ქულები</h2>
          </div>
          <div className="text-right leading-none">
            <span className="font-display text-3xl font-light">{profile.points}</span>
            <span className="text-sm text-white/80 ml-1">ქულა</span>
          </div>
        </div>
        <p className="text-[11px] text-white/70 mt-1">1 ქულა = 1₾ ფასდაკლება შეკვეთისას</p>
      </div>

      {/* Referral link */}
      <div className="space-y-2 pt-5 border-t border-white/20">
        <div className="flex items-center gap-2 text-white/90">
          <Gift size={16} />
          <h3 className="font-body text-sm font-medium">მოიწვie მეგობარი</h3>
        </div>
        <p className="text-xs text-white/70">
          გააზიარე ბმული — მეგობრის ყოველ შეკვეთაზე მიიღებ <strong>5%-ს ქულებში</strong>.
        </p>
        <div className="flex items-center gap-2 bg-white/15 rounded-xl p-1 pl-3 backdrop-blur-sm">
          <span className="flex-1 text-xs truncate text-white/90 font-mono">{referralLink}</span>
          <button
            onClick={copyLink}
            className="shrink-0 bg-white text-rose-500 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1.5 hover:bg-white/90 transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'დაკოპირდა' : 'კოპირება'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 pt-5 border-t border-white/20">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-white/70" />
          <span className="text-sm">
            <strong>{stats.invited}</strong> <span className="text-white/70">მოწვეული</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Check size={15} className="text-white/70" />
          <span className="text-sm">
            <strong>{stats.qualified}</strong> <span className="text-white/70">აქტიური</span>
          </span>
        </div>
      </div>
    </div>
  );
};
