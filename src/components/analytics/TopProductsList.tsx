import { ProductRevenueRow } from '@/hooks/useAnalytics';

interface TopProductsListProps {
  products: ProductRevenueRow[];
}

export const TopProductsList = ({ products }: TopProductsListProps) => {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No product sales in this range</p>
    );
  }

  const maxRevenue = products[0].revenue;

  return (
    <div className="space-y-3">
      {products.map((p, idx) => (
        <div key={p.productId} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground/60 w-4 tabular-nums shrink-0">
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground truncate">{p.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">{p.units} units</span>
                <span className="text-sm font-semibold tabular-nums">₾{p.revenue.toFixed(2)}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-rose-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-500 transition-all"
                style={{ width: `${maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
