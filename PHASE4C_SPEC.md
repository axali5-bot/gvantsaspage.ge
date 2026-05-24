# Phase 4C — Admin Analytics Dashboard

**Architect:** Claude Opus 4.7
**Executor:** Claude Sonnet 4.6
**Created:** 2026-05-24
**Status:** READY TO EXECUTE
**Depends on:** Phase 4A (`09120cf` + `c08343a`) + Phase 4B (`fde7675` + `5bde1e9`)

---

## 🎯 Goal

Sales overview page for admin. KPIs, time-series chart of orders, top products by revenue, status breakdown pie. Single page at `/admin/analytics`. Owner-only — uses existing `useOrders()` admin hook (RLS-gated by `is_admin()`).

**Non-goals (deferred):**
- Customer growth / cohort analytics → Future
- Refund tracking → Future (needs schema)
- CSV/PDF export → Future
- Real-time WebSocket updates → Future (TanStack Query polling is enough)
- Per-product profit margins (no cost column) → Future
- i18n for admin labels → admin is single-user, English is fine (matches existing admin pages)

---

## 📊 Current State (verified)

**Dependencies (READY — no install needed):**
- `recharts@^2.15.4` — installed ✓
- `date-fns@^3.6.0` — installed ✓

**Existing infrastructure:**
- `useOrders()` in `src/hooks/useOrders.ts` returns ALL orders with nested `order_items(*, products(*))`, RLS-protected by `is_admin()`
- `ProtectedAdminRoute` guards `/admin/*` paths
- `AdminLayout` provides top nav + container shell
- Admin uses neutral shadcn tokens (`bg-background`, `border-border`, `text-muted-foreground`) — NOT customer-side rose theme. Rose-500 is acceptable as a single accent color (theme `primary` resolves to it).

**Status colors (reuse from Phase 4B for consistency):**
- pending: `#eab308` (yellow-500)
- processing: `#3b82f6` (blue-500)
- completed: `#22c55e` (green-500)
- cancelled: `#ef4444` (red-500)

---

## 🗄️ Database Migration

**NONE.** All aggregations are client-side from the orders query.

---

## 📁 Files to Create / Modify

### NEW files

#### `src/hooks/useAnalytics.ts`
**Purpose:** Single hook that derives all analytics from `useOrders()`.

```ts
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
  date: string;        // 'MMM dd' for display
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
}

const getRangeCutoff = (range: TimeRange): Date | null => {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return startOfDay(subDays(new Date(), days - 1));
};

export const useAnalytics = (range: TimeRange): AnalyticsResult => {
  const { data: orders = [], isLoading, isError } = useOrders();

  return useMemo(() => {
    const cutoff = getRangeCutoff(range);
    const filtered = orders.filter((o) => {
      if (!cutoff) return true;
      if (!o.created_at) return false;
      return new Date(o.created_at) >= cutoff;
    });

    // REVENUE: exclude cancelled (industry standard)
    const revenueOrders = filtered.filter((o) => o.status !== 'cancelled');
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const orderCount = revenueOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // TOP PRODUCT (by units sold across all order_items, cancelled excluded)
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

    // ORDERS PER DAY (fills missing days with 0)
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
      // 'all' → bucket by month-day from earliest order
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

    // STATUS BREAKDOWN (includes cancelled — this is about all orders, not revenue)
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
      isLoading,
      isError,
    };
  }, [orders, range, isLoading, isError]);
};
```

#### `src/components/analytics/KPICard.tsx`
**Purpose:** Single KPI tile.

**Props:**
```ts
interface KPICardProps {
  label: string;
  value: string;          // already-formatted
  icon: LucideIcon;
  hint?: string;          // e.g. "Last 30 days"
}
```

**Visual:**
- Card: `border border-border rounded-sm p-5 bg-background`
- Icon: top-right, `text-muted-foreground`, size 18
- Label: `text-xs uppercase tracking-widest text-muted-foreground`
- Value: `font-display text-3xl font-light text-foreground mt-2`
- Hint: `text-[10px] text-muted-foreground/60 mt-1`

#### `src/components/analytics/TimeRangePills.tsx`
**Purpose:** Segmented control for `'7d' | '30d' | '90d' | 'all'`.

**Props:**
```ts
interface TimeRangePillsProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}
```

**Visual:**
- Container: `inline-flex p-1 bg-muted rounded-sm`
- Each pill: `px-3 py-1.5 text-xs uppercase tracking-widest font-semibold`
- Active: `bg-background text-foreground shadow-sm`
- Inactive: `text-muted-foreground hover:text-foreground`

#### `src/components/analytics/OrdersBarChart.tsx`
**Purpose:** Daily orders bar chart with revenue line overlay.

**Props:**
```ts
interface OrdersBarChartProps {
  data: OrdersPerDayPoint[];
  empty: boolean;
}
```

**Recharts setup:**
- `ResponsiveContainer width="100%" height={280}`
- `ComposedChart` with `CartesianGrid strokeDasharray="3 3" stroke-opacity={0.15}`
- `XAxis dataKey="date" stroke="#9ca3af" fontSize={11}`
- Left `YAxis` for orders (rose-500 bars)
- Right `YAxis` for revenue (line)
- `Bar dataKey="orders" fill="#f43f5e" radius={[4,4,0,0]}` (rose-500)
- `Line dataKey="revenue" stroke="#a78bfa" strokeWidth={2}` (purple accent — distinct from bars)
- `Tooltip` with custom formatter: `(value, name) => name === 'revenue' ? `₾${value}` : value`
- Empty state: gray "No data in this range" centered

#### `src/components/analytics/TopProductsList.tsx`
**Purpose:** Top 5 products with revenue bars.

**Props:**
```ts
interface TopProductsListProps {
  products: ProductRevenueRow[];
}
```

**Visual:**
- Each row: name (truncate), unit count, revenue, inline progress bar (`bg-rose-100` track, `bg-rose-500` fill proportional to max revenue in the set)
- Layout: `space-y-3`, each row `flex items-center gap-3`

#### `src/components/analytics/StatusBreakdown.tsx`
**Purpose:** Pie chart of order status distribution.

**Props:**
```ts
interface StatusBreakdownProps {
  buckets: StatusBucket[];
}
```

**Recharts setup:**
- `PieChart` 200x200, `Pie cx="50%" cy="50%" outerRadius={70} innerRadius={40}` (donut)
- Slice colors map: `{ pending:'#eab308', processing:'#3b82f6', completed:'#22c55e', cancelled:'#ef4444' }`
- `Legend` to the right (vertical) with count + percent
- `Tooltip` shows `${status}: ${count} (${percent.toFixed(1)}%)`

#### `src/pages/admin/AdminAnalytics.tsx`
**Purpose:** The dashboard page itself.

**Layout (top to bottom):**
1. Header row: `<h2>Analytics ({filteredCount} orders)</h2>` + `<TimeRangePills>`
2. 4 KPI cards (grid, `grid-cols-2 lg:grid-cols-4 gap-4`)
3. Two columns (`grid-cols-1 lg:grid-cols-3 gap-4`):
   - Left (col-span-2): `OrdersBarChart`
   - Right (col-span-1): `StatusBreakdown`
4. Full-width: `TopProductsList` inside a bordered card

**Loading state:** simple "Loading analytics..." centered, no skeletons.
**Error state:** red error message + retry button.
**Empty state (no orders in range):** centered "No orders in this range" with a hint.

**KPI formatting:**
- Revenue: `₾ ${value.toFixed(2)}` (Georgian Lari symbol after — match existing convention)
- Order count: integer
- AOV: `₾ ${value.toFixed(2)}`
- Top product: name (truncated to 28 chars) or `—`

### MODIFIED files

#### `src/App.tsx`
Add lazy import and route inside the existing `ProtectedAdminRoute` block:

```tsx
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));

// Inside ProtectedAdminRoute element:
<Route path="/admin/analytics" element={
  <Suspense fallback={<AdminFallback />}><AdminAnalytics /></Suspense>
} />
```

#### `src/pages/admin/AdminLayout.tsx`
Add `BarChart3` from lucide-react and a new nav item:

```tsx
import { ArrowLeft, Package, ShoppingBag, Tags, BookOpen, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/catalogs', label: 'Catalogs', icon: BookOpen },
];
```

Optional: change the default redirect from `/admin/products` to `/admin/analytics` so admins land on the dashboard. **Decision: YES, do it.** Analytics is a better landing page.

In `App.tsx`:
```tsx
// OLD:
<Route path="/admin" element={<Navigate to="/admin/products" replace />} />
// NEW:
<Route path="/admin" element={<Navigate to="/admin/analytics" replace />} />
```

---

## 🎨 Design Tokens

| Element | Token |
|---|---|
| Cards | `border border-border rounded-sm bg-background` |
| Card padding | `p-5` |
| Section gap | `gap-4` |
| KPI label | `text-xs uppercase tracking-widest text-muted-foreground` |
| KPI value | `font-display text-3xl font-light` |
| Chart bars | `#f43f5e` (rose-500) |
| Revenue line | `#a78bfa` (purple-400 — distinct accent) |
| Status pending | `#eab308` |
| Status processing | `#3b82f6` |
| Status completed | `#22c55e` |
| Status cancelled | `#ef4444` |
| Grid lines | `opacity-15` on stroke |

**Do NOT introduce gold.** Gold is locked to the 6 customer-side spots from Hybrid C.

---

## 🔒 Security

- `useOrders()` is already RLS-protected by `is_admin()` — non-admins cannot fetch
- `ProtectedAdminRoute` blocks page access for non-admins
- All aggregations happen client-side after RLS filter — no raw data leak risk

---

## 🧪 Acceptance Criteria

**Empty state:**
1. Brand-new install with 0 orders → "No orders in this range" with hint
2. Range = 7d but newest order is 30 days old → "No orders in this range"

**Has data:**
1. Default range = `30d` on load
2. KPIs reflect filter (changing range updates all 4 cards)
3. Cancelled orders excluded from Revenue, Count, AOV, Top Product
4. Cancelled orders INCLUDED in Status Breakdown (it's a status, not revenue)
5. Bar chart shows every day in the range, even days with 0 orders (when range != 'all')
6. Top products limited to 5, sorted by revenue descending
7. Pie chart sums to 100%

**Mobile (sm breakpoint):**
1. KPI grid collapses to 2 columns
2. Charts shrink, remain readable
3. TimeRangePills don't wrap awkwardly

**Navigation:**
1. From `AdminLayout` nav → click "Analytics" → `/admin/analytics`
2. Bare `/admin` → redirects to `/admin/analytics` (not `/admin/products` anymore)
3. Lazy chunk only loads when route hits

**Refresh:**
1. TanStack Query caches `useOrders()` — refetch invalidates derived analytics
2. No separate refetch button needed — query keys handle it

---

## 📦 Deliverable Sequence (Sonnet execution order)

1. **Create `useAnalytics.ts`** — pure derivation logic, easy to test mentally
2. **Create `KPICard.tsx`** — single-responsibility primitive
3. **Create `TimeRangePills.tsx`** — segmented control primitive
4. **Create `OrdersBarChart.tsx`** — Recharts composition
5. **Create `StatusBreakdown.tsx`** — Recharts pie
6. **Create `TopProductsList.tsx`** — simple list with inline bars
7. **Create `AdminAnalytics.tsx`** — wires everything together
8. **Update `AdminLayout.tsx`** — add Analytics nav item
9. **Update `App.tsx`** — lazy import + route + redirect
10. **TypeScript check** — `npx tsc --noEmit`
11. **Build** — `bun run build`
12. **Manual smoke test** — verify with current order data
13. **Commit + push** — single descriptive commit
14. **Verify Vercel** — production URL works
15. **Report back**

---

## ⚠️ Watch Out For

- **`order.total_price` and `item.price_at_time`** can come back as `string` from Postgres `numeric`. Wrap with `Number(...)` before arithmetic. The spec code does this — DO NOT remove the casts.
- **`order.created_at` can be null** in the type — guard with `if (!o.created_at)`. Don't crash on missing dates.
- **Recharts SSR:** project is SPA-only (Vite), so no SSR concerns. `ResponsiveContainer` works fine on client.
- **Recharts bundle size:** Recharts is ~95kB gzipped. It MUST land in the lazy `AdminAnalytics` chunk, not in the customer bundle. Since `AdminAnalytics` is lazy-imported and the chart components are only imported by it, Vite will tree-split correctly. Verify in the build output: chart deps should appear in the analytics chunk, NOT in `index-*.js`.
- **`useMemo` dependency:** include `isLoading` and `isError` in the memo deps (the spec already does).
- **Date format:** `'MMM dd'` produces "May 24" in English. Admin is English-only, so this is fine. Don't localize.
- **PieChart with all 0s:** if a status bucket has 0, Recharts may render an invisible slice. That's acceptable — legend still shows "0 (0.0%)".
- **Don't introduce i18n for admin labels.** Existing admin pages use English literals. Stay consistent.

---

## 🚦 Hand-off Protocol — CRITICAL

**▸ BLOCKER triggers** (stop work, escalate to Opus 4.7):
- Recharts has API breaking change vs spec (unlikely at 2.15.4 but possible)
- Aggregation logic produces obviously wrong numbers — flag specific examples
- Design decision not covered above — DON'T improvise on visual hierarchy
- Format: `🚨 Senior Fullstack Opus 4.7-ის შემოსვლა მჭირდება — blocker: [აღწერე]`

**▸ Phase 4C COMPLETE** (after all 15 deliverables + Vercel verify):
```
🔄 გადართე Opus 4.7-ზე — Phase 4C done. Ready for:
   - Code review by Senior Architect
   - Phase 4D planning (Auth polish — Google OAuth, password reset, MFA)
```

Never start Phase 4D autonomously.

---

## 📊 Report Format (when complete)

When done, report:
- Which deliverables completed, which blocked
- Bundle size check: did Recharts land in the analytics chunk and NOT the customer bundle? (paste relevant line from `bun run build` output)
- Smoke test: numbers look right? (manually spot-check 1 KPI against raw orders)
- Mobile breakpoint sanity check (1 sentence is fine)
- Any deviation from spec + reason
- Production URL where verified
- Open questions for Opus

---

## 🚦 After Phase 4C → Phase 4D Preview

**Phase 4D — Auth Polish** (final bundle, Opus design)
- Google OAuth via Supabase Auth provider
- Password reset flow (`/auth/forgot-password` + email link → `/auth/reset-password`)
- MFA (TOTP) — optional toggle in `/account`
- Leaked-password protection (Supabase setting)
- Email notifications on order status change (Supabase Edge Function trigger)

Phase 4D is the final phase. After it, AVON2FLAME has full customer + admin parity.
