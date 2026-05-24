import { useMemo } from 'react';
import { subDays, startOfDay, eachDayOfInterval, format } from 'date-fns';
import { useOrders, Order } from './useOrders';

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsKPIs {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  topProductName: string | null;
}

export interface OrdersPerDayPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface ProductRevenueRow {
  productId: string;
  name: string;
  revenue: number;
  units: number;
}

export interface StatusBucket {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  count: number;
  percent: number;
}

export interface AnalyticsResult {
  kpis: AnalyticsKPIs;
  ordersPerDay: OrdersPerDayPoint[];
  topProducts: ProductRevenueRow[];
  statusBreakdown: StatusBucket[];
  filteredCount: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const getRangeCutoff = (range: TimeRange): Date | null => {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return startOfDay(subDays(new Date(), days - 1));
};

export const useAnalytics = (range: TimeRange): AnalyticsResult => {
  const { data: orders = [], isLoading, isError, refetch } = useOrders();

  const result = useMemo(() => {
    const cutoff = getRangeCutoff(range);
    const filtered = orders.filter((o) => {
      if (!cutoff) return true;
      if (!o.created_at) return false;
      return new Date(o.created_at) >= cutoff;
    });

    // Revenue: cancelled excluded (industry standard)
    const revenueOrders = filtered.filter((o) => o.status !== 'cancelled');
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const orderCount = revenueOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Top products (by revenue, cancelled excluded)
    const productMap = new Map<string, ProductRevenueRow>();
    for (const order of revenueOrders) {
      for (const item of order.order_items || []) {
        if (!item.product_id) continue;
        const name =
          item.products?.name_ka ||
          item.products?.name_en ||
          item.products?.name_ru ||
          'Unknown';
        const existing = productMap.get(item.product_id) || {
          productId: item.product_id,
          name,
          revenue: 0,
          units: 0,
        };
        existing.units += item.quantity;
        existing.revenue += item.quantity * Number(item.price_at_time || 0);
        productMap.set(item.product_id, existing);
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const topProductName = topProducts[0]?.name ?? null;

    // Orders per day (fill empty days with 0)
    let ordersPerDay: OrdersPerDayPoint[] = [];
    if (cutoff) {
      const days = eachDayOfInterval({ start: cutoff, end: new Date() });
      ordersPerDay = days.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        const dayOrders = filtered.filter(
          (o) => o.created_at && format(new Date(o.created_at), 'yyyy-MM-dd') === key
        );
        const dayRevenue = dayOrders
          .filter((o) => o.status !== 'cancelled')
          .reduce((s, o) => s + Number(o.total_price || 0), 0);
        return {
          date: format(d, 'MMM dd'),
          orders: dayOrders.length,
          revenue: Math.round(dayRevenue),
        };
      });
    } else {
      const byKey = new Map<string, { orders: Order[]; date: Date }>();
      for (const o of filtered) {
        if (!o.created_at) continue;
        const d = new Date(o.created_at);
        const key = format(d, 'yyyy-MM-dd');
        if (!byKey.has(key)) byKey.set(key, { orders: [], date: d });
        byKey.get(key)!.orders.push(o);
      }
      ordersPerDay = Array.from(byKey.entries())
        .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
        .map(([, v]) => {
          const dayRevenue = v.orders
            .filter((o) => o.status !== 'cancelled')
            .reduce((s, o) => s + Number(o.total_price || 0), 0);
          return {
            date: format(v.date, 'MMM dd'),
            orders: v.orders.length,
            revenue: Math.round(dayRevenue),
          };
        });
    }

    // Status breakdown (all orders including cancelled)
    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const o of filtered) {
      const s = (o.status || 'pending') as keyof typeof statusCounts;
      if (s in statusCounts) statusCounts[s]++;
    }
    const total = filtered.length;
    const statusBreakdown: StatusBucket[] = (
      ['pending', 'processing', 'completed', 'cancelled'] as const
    ).map((s) => ({
      status: s,
      count: statusCounts[s],
      percent: total > 0 ? (statusCounts[s] / total) * 100 : 0,
    }));

    return {
      kpis: { totalRevenue, orderCount, avgOrderValue, topProductName },
      ordersPerDay,
      topProducts,
      statusBreakdown,
      filteredCount: filtered.length,
    };
  }, [orders, range]);

  return { ...result, isLoading, isError, refetch };
};
