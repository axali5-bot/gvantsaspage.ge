import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Gift, ShoppingBag, Users, Minus, Settings2, History } from 'lucide-react';

interface PointTx {
  id: string;
  kind: string;
  points: number;
  note: string | null;
  created_at: string;
}

const KIND_META: Record<string, { label: string; Icon: typeof Gift }> = {
  signup: { label: 'რეგისტრაციის ბონუსი', Icon: Gift },
  earn: { label: 'შეკვეთის ბონუსი', Icon: ShoppingBag },
  referral: { label: 'მეგობრის მოწვევა', Icon: Users },
  redeem: { label: 'ქულების გამოყენება', Icon: Minus },
  admin: { label: 'კორექტირება', Icon: Settings2 },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' });

/** Customer-facing ledger of all point movements (RLS: user sees only their own). */
export const PointsHistory = () => {
  const { user } = useAuth();
  const { data: txs = [], isLoading } = useQuery<PointTx[]>({
    queryKey: ['point-history', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('point_transactions')
        .select('id, kind, points, note, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  if (isLoading || txs.length === 0) return null;

  return (
    <div className="bg-white rounded-[1.5rem] border border-rose-100 shadow-sm p-8 space-y-4">
      <div className="flex items-center gap-2 text-rose-500/80">
        <History size={18} />
        <h2 className="font-display text-lg">ქულების ისტორია</h2>
      </div>
      <div>
        {txs.map((tx) => {
          const meta = KIND_META[tx.kind] ?? { label: tx.note ?? tx.kind, Icon: Settings2 };
          const positive = tx.points >= 0;
          return (
            <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-rose-50 last:border-0">
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${positive ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                <meta.Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-gray-700 truncate">{meta.label}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(tx.created_at)}</p>
              </div>
              <span className={`font-display text-sm font-semibold shrink-0 ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
                {positive ? '+' : ''}{tx.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
