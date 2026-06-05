import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, Gift } from 'lucide-react';

interface LoyaltyRow {
  id: string;
  full_name: string | null;
  email: string | null;
  points: number;
  referral_code: string | null;
  invited: number;
}

/** Admin-only view of registered customers' points + referral activity. */
export const LoyaltyPanel = () => {
  const { data: rows = [], isLoading } = useQuery<LoyaltyRow[]>({
    queryKey: ['loyalty-customers'],
    queryFn: async () => {
      const [{ data: profiles }, { data: refs }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, points, referral_code').order('points', { ascending: false }),
        supabase.from('referrals').select('referrer_id, status'),
      ]);
      const invited = new Map<string, number>();
      (refs ?? []).forEach((r) => {
        if (r.status === 'qualified') invited.set(r.referrer_id, (invited.get(r.referrer_id) ?? 0) + 1);
      });
      return (profiles ?? []).map((p) => ({ ...p, invited: invited.get(p.id) ?? 0 }));
    },
  });

  if (isLoading || rows.length === 0) return null;

  const totalIssued = rows.reduce((s, r) => s + (r.points || 0), 0);

  return (
    <div className="space-y-3 pt-6">
      <div className="flex items-center gap-2">
        <Gift size={15} className="text-rose-500" />
        <h3 className="font-display text-lg">ლოიალურობა &amp; რეფერალები</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          გაცემული ქულები: <strong className="text-rose-500">{totalIssued}</strong>
        </span>
      </div>
      <div className="border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">მომხმარებელი</th>
              <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">ქულები</th>
              <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium hidden sm:table-cell">მოწვეული</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium hidden md:table-cell">კოდი</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{r.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                    <Sparkles size={12} />{r.points}
                  </span>
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">{r.invited}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">{r.referral_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
