import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, ShoppingBag, TrendingUp, Star, Bell, ChevronRight, Wallet, PiggyBank, Percent, Boxes, AlertTriangle } from 'lucide-react';
import { useAnalytics, TimeRange } from '@/hooks/useAnalytics';
import { useProfitability } from '@/hooks/useProfitability';
import { KPICard } from '@/components/analytics/KPICard';
import { TimeRangePills } from '@/components/analytics/TimeRangePills';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { ProfitChart } from '@/components/analytics/ProfitChart';
import { StatusBreakdown } from '@/components/analytics/StatusBreakdown';
import { TopProductsList } from '@/components/analytics/TopProductsList';
import { TopProfitList } from '@/components/analytics/TopProfitList';
import { StockAlerts } from '@/components/analytics/StockAlerts';

const RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

const RANGE_VS: Record<TimeRange, string> = {
  '7d': 'vs. prev. 7d',
  '30d': 'vs. prev. 30d',
  '90d': 'vs. prev. 90d',
  all: '',
};

const AdminAnalytics = () => {
  const [range, setRange] = useState<TimeRange>('30d');
  const navigate = useNavigate();
  const {
    kpis,
    revenueChange,
    ordersPerDay,
    topProducts,
    statusBreakdown,
    filteredCount,
    pendingCount,
    isLoading,
    isError,
    refetch,
  } = useAnalytics(range);
  const profit = useProfitability(range);

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
    <div className="space-y-4">
      {/* ── Operational Alerts (always visible, above time-range filter) ── */}
      <div className="space-y-2">
        {/* Pending orders banner */}
        {pendingCount > 0 && (
          <button
            onClick={() => navigate('/admin/orders')}
            className="w-full flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 rounded-sm px-4 py-3 text-left hover:bg-rose-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Bell size={15} className="text-rose-500 shrink-0" />
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                {pendingCount} შეკვეთა ელოდება დამუშავებას
              </span>
            </div>
            <ChevronRight size={14} className="text-rose-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Stock alerts */}
        <StockAlerts />
      </div>

      {/* ── Header ── */}
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
              hint={RANGE_VS[range] || hint}
              trend={revenueChange}
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
                Revenue
              </h3>
              <RevenueChart data={ordersPerDay} empty={ordersPerDay.length === 0} />
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

          {/* ── Profitability (მოგება) ── */}
          <div className="flex items-center gap-3 pt-4">
            <h2 className="font-display text-xl">მოგება</h2>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Trust banner: profit is only as good as the cost data behind it */}
          {profit.coveragePct < 100 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                თვითღირებულება ცნობილია გაყიდული ერთეულების{' '}
                <span className="font-semibold">{profit.coveragePct.toFixed(0)}%</span>-ზე — მოგება
                რეალურზე მაღალი ჩანს. შეავსე შესყიდვის ფასები (Products ✏️ ან Purchases-ით) და ეს
                მაჩვენებელი დაზუსტდება.
              </p>
            </div>
          )}

          {/* Profit KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="თვითღირებულება (COGS)"
              value={`₾${profit.cogs.toFixed(2)}`}
              icon={Wallet}
              hint={hint}
            />
            <KPICard
              label="მთლიანი მოგება"
              value={`₾${profit.grossProfit.toFixed(2)}`}
              icon={PiggyBank}
              hint={hint}
            />
            <KPICard
              label="მარჟა"
              value={`${profit.marginPct.toFixed(1)}%`}
              icon={Percent}
              hint={hint}
            />
            <KPICard
              label="საწყობის ღირებულება"
              value={`₾${profit.inventoryValue.toFixed(2)}`}
              icon={Boxes}
              hint="მარაგი × თვითღირებულება"
            />
          </div>

          {/* Profit chart + top-by-profit */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 border border-border rounded-sm p-5 bg-background">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                შემოსავალი vs მოგება
              </h3>
              <ProfitChart data={profit.profitPerDay} empty={profit.profitPerDay.length === 0} />
            </div>
            <div className="border border-border rounded-sm p-5 bg-background">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                ტოპ პროდუქტები მოგებით
              </h3>
              <TopProfitList products={profit.topByProfit} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
