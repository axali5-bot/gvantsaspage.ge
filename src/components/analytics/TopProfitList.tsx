import { ProductProfitRow } from '@/hooks/useProfitability';

interface TopProfitListProps {
  products: ProductProfitRow[];
}

/** Top products ranked by gross profit (not revenue — a bestseller with a thin
 *  margin can earn less than a slow mover with a fat one). */
export const TopProfitList = ({ products }: TopProfitListProps) => {
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No product sales in this range</p>;
  }

  const maxProfit = Math.max(products[0]?.profit ?? 0, 0);

  return (
    <div className="space-y-3">
      {products.map((p, idx) => (
        <div key={p.productId} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground/60 w-4 tabular-nums shrink-0">{idx + 1}</span>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground truncate">{p.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">{p.units} units</span>
                <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
                  {p.marginPct.toFixed(0)}%
                </span>
                <span className={`text-sm font-semibold tabular-nums ${p.profit >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                  ₾{p.profit.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${maxProfit > 0 ? (Math.max(p.profit, 0) / maxProfit) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
