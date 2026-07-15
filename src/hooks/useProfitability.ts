import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, eachDayOfInterval, format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useOrders } from './useOrders';
import { useProducts } from './useProducts';
import { useProductCosts } from './useProductCosts';
import { useExpenses } from './useExpenses';
import type { TimeRange } from './useAnalytics';

export interface ProfitPerDayPoint {
  date: string;
  revenue: number;
  profit: number;
}

export interface ProductProfitRow {
  productId: string;
  name: string;
  units: number;
  revenue: number;
  cogs: number;
  profit: number;
  marginPct: number;
}

export interface ProfitabilityResult {
  cogs: number;
  grossProfit: number;
  marginPct: number;          // 0–100
  expensesTotal: number;      // operating expenses inside the range
  netProfit: number;          // grossProfit − expensesTotal
  inventoryValue: number;     // Σ stock × current cost (products with known cost)
  coveragePct: number;        // 0–100: % of sold units whose cost is known
  profitPerDay: ProfitPerDayPoint[];
  topByProfit: ProductProfitRow[];
  isLoading: boolean;
}

/** order_item_id → cost_at_time, from the admin-only snapshot table.
 *  Non-admins get an empty map (RLS filters all rows). */
const useOrderItemCosts = () => {
  return useQuery<Map<string, number>>({
    queryKey: ['order_item_costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_item_costs')
        .select('order_item_id, cost_at_time');
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) map.set(row.order_item_id, Number(row.cost_at_time));
      return map;
    },
    staleTime: 30_000,
  });
};

const getRangeCutoff = (range: TimeRange): Date | null => {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return startOfDay(subDays(new Date(), days - 1));
};

/**
 * Profit view over the same orders the revenue analytics use (cancelled
 * excluded). Cost per sold item = snapshot taken at checkout
 * (order_item_costs), falling back to the product's CURRENT cost for
 * historical items sold before snapshotting existed — flagged via coveragePct.
 */
export const useProfitability = (range: TimeRange): ProfitabilityResult => {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: currentCosts = new Map(), isLoading: costsLoading } = useProductCosts();
  const { data: snapshots = new Map(), isLoading: snapsLoading } = useOrderItemCosts();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();

  const isLoading = ordersLoading || productsLoading || costsLoading || snapsLoading || expensesLoading;

  const result = useMemo(() => {
    const cutoff = getRangeCutoff(range);
    const inRange = orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      if (!cutoff) return true;
      return !!o.created_at && new Date(o.created_at) >= cutoff;
    });

    let revenue = 0;
    let cogs = 0;
    let unitsTotal = 0;
    let unitsCosted = 0;

    // Per-day + per-product accumulation in one pass.
    const dayMap = new Map<string, { revenue: number; cogs: number }>();
    const productMap = new Map<string, ProductProfitRow>();

    for (const order of inRange) {
      const dayKey = order.created_at ? format(new Date(order.created_at), 'yyyy-MM-dd') : null;
      for (const item of order.order_items || []) {
        const qty = item.quantity || 0;
        const lineRevenue = qty * Number(item.price_at_time || 0);
        const snap = snapshots.get(item.id);
        const current = item.product_id ? currentCosts.get(item.product_id) : undefined;
        // A 0-value snapshot means "cost wasn't entered yet at sale time" —
        // fall back to the current cost so filling costs in later improves history.
        const unitCost = snap && snap > 0 ? snap : current;
        const hasCost = unitCost !== undefined && unitCost > 0;
        const lineCogs = qty * (hasCost ? unitCost : 0);

        revenue += lineRevenue;
        cogs += lineCogs;
        unitsTotal += qty;
        if (hasCost) unitsCosted += qty;

        if (dayKey) {
          const d = dayMap.get(dayKey) ?? { revenue: 0, cogs: 0 };
          d.revenue += lineRevenue;
          d.cogs += lineCogs;
          dayMap.set(dayKey, d);
        }

        if (item.product_id) {
          const name =
            item.products?.name_ka || item.products?.name_en || item.products?.name_ru || 'Unknown';
          const row = productMap.get(item.product_id) ?? {
            productId: item.product_id, name, units: 0, revenue: 0, cogs: 0, profit: 0, marginPct: 0,
          };
          row.units += qty;
          row.revenue += lineRevenue;
          row.cogs += lineCogs;
          productMap.set(item.product_id, row);
        }
      }
    }

    const grossProfit = revenue - cogs;
    const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const coveragePct = unitsTotal > 0 ? (unitsCosted / unitsTotal) * 100 : 100;

    // Chart series — fill empty days inside a bounded range (same as revenue chart).
    let profitPerDay: ProfitPerDayPoint[] = [];
    if (cutoff) {
      profitPerDay = eachDayOfInterval({ start: cutoff, end: new Date() }).map((d) => {
        const v = dayMap.get(format(d, 'yyyy-MM-dd')) ?? { revenue: 0, cogs: 0 };
        return {
          date: format(d, 'MMM dd'),
          revenue: Math.round(v.revenue),
          profit: Math.round(v.revenue - v.cogs),
        };
      });
    } else {
      profitPerDay = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, v]) => ({
          date: format(new Date(key), 'MMM dd'),
          revenue: Math.round(v.revenue),
          profit: Math.round(v.revenue - v.cogs),
        }));
    }

    const topByProfit = Array.from(productMap.values())
      .map((r) => ({
        ...r,
        profit: r.revenue - r.cogs,
        marginPct: r.revenue > 0 ? ((r.revenue - r.cogs) / r.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // Money sitting on the shelf, valued at current cost.
    const inventoryValue = products.reduce((sum, p) => {
      const cost = currentCosts.get(p.id);
      if (!cost || cost <= 0) return sum;
      return sum + (p.stock_quantity ?? 0) * cost;
    }, 0);

    // Operating expenses inside the same range → net profit.
    const expensesTotal = expenses.reduce((sum, e) => {
      if (cutoff && new Date(e.spent_at) < cutoff) return sum;
      return sum + e.amount;
    }, 0);
    const netProfit = grossProfit - expensesTotal;

    return {
      cogs, grossProfit, marginPct, expensesTotal, netProfit,
      inventoryValue, coveragePct, profitPerDay, topByProfit,
    };
  }, [orders, products, currentCosts, snapshots, expenses, range]);

  return { ...result, isLoading };
};
