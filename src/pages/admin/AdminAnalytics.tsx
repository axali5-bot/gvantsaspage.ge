import { useState } from 'react';
import { Banknote, ShoppingBag, TrendingUp, Star } from 'lucide-react';
import { useAnalytics, TimeRange } from '@/hooks/useAnalytics';
import { KPICard } from '@/components/analytics/KPICard';
import { TimeRangePills } from '@/components/analytics/TimeRangePills';
import { OrdersBarChart } from '@/components/analytics/OrdersBarChart';
import { StatusBreakdown } from '@/components/analytics/StatusBreakdown';
import { TopProductsList } from '@/components/analytics/TopProductsList';

const RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

const AdminAnalytics = () => {
  const [range, setRange] = useState<TimeRange>('30d');
  const {
    kpis,
    ordersPerDay,
    topProducts,
    statusBreakdown,
    filteredCount,
    isLoading,
    isError,
    refetch,
  } = useAnalytics(range);

  const hint = RANGE_LABELS[range];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground uppercase tracking-widest">
        Loading analytics...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-destructive">Failed to load analytics data</p>
        <button
          onClick={() => refetch()}
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border px-4 py-2 rounded-sm transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const noOrders = filteredCount === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display text-xl">
          Analytics
          <span className="ml-2 text-sm font-body text-muted-foreground font-normal">
            ({filteredCount} orders)
          </span>
        </h2>
        <TimeRangePills value={range} onChange={setRange} />
      </div>

      {noOrders ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-border rounded-sm">
          <p className="text-sm text-muted-foreground">No orders in this range</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try a wider time range</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Revenue"
              value={`₾${kpis.totalRevenue.toFixed(2)}`}
              icon={Banknote}
              hint={hint}
            />
            <KPICard
              label="Orders"
              value={String(kpis.orderCount)}
              icon={ShoppingBag}
              hint={hint}
            />
            <KPICard
              label="Avg Order Value"
              value={`₾${kpis.avgOrderValue.toFixed(2)}`}
              icon={TrendingUp}
              hint={hint}
            />
            <KPICard
              label="Top Product"
              value={
                kpis.topProductName
                  ? kpis.topProductName.length > 28
                    ? kpis.topProductName.slice(0, 28) + '…'
                    : kpis.topProductName
                  : '—'
              }
              icon={Star}
              hint={hint}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 border border-border rounded-sm p-5 bg-background">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Orders & Revenue
              </h3>
              <OrdersBarChart data={ordersPerDay} empty={ordersPerDay.length === 0} />
            </div>
            <div className="border border-border rounded-sm p-5 bg-background">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Order Status
              </h3>
              <StatusBreakdown buckets={statusBreakdown} />
            </div>
          </div>

          {/* Top Products */}
          <div className="border border-border rounded-sm p-5 bg-background">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Top Products by Revenue
            </h3>
            <TopProductsList products={topProducts} />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
