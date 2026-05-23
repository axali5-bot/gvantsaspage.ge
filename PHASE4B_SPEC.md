# Phase 4B — Customer Order History UI

**Architect:** Claude Opus 4.7
**Executor:** Claude Sonnet 4.6
**Created:** 2026-05-24
**Status:** READY TO EXECUTE
**Depends on:** Phase 4A (DONE — `09120cf` + `c08343a`)

---

## 🎯 Goal

Customer-side order history page. Customers see their orders (filtered by RLS), expandable cards with details, visual status timeline. Replaces the "Coming soon" placeholder in `/account`.

**Non-goals (deferred):**
- Google OAuth → Phase 4D (Auth polish bundle)
- Email notifications (status updates) → Phase 4D
- Order receipts (PDF export) → Future
- Re-order functionality → Future
- Pagination / infinite scroll → only when realistic data justifies it

---

## 📊 Current State (verified post-Phase 4A)

**Database (READY — no migration needed):**
- `orders.user_id` column exists
- RLS policy `orders_customer_select_own` filters by `auth.uid()`
- RLS policy `order_items_customer_select_own` allows nested fetch
- Indexes: `idx_orders_user_id` exists

**Hooks (READY):**
- `useCustomerOrders()` in `src/hooks/useOrders.ts` — returns user's orders with nested `order_items(*, products(name_ka, name_en, name_ru, image_url))`, ordered by `created_at desc`, `enabled: !!user`

**Routes (READY):**
- `<ProtectedCustomerRoute />` guards `/account/*`
- `/account` page exists with "Coming soon" placeholder

**i18n (PARTIAL):**
- `account.my_orders`, `account.orders_coming_soon` exist
- Missing: status labels (pending/processing/completed/cancelled), date formatting, order detail labels

---

## 🗄️ Database Migration

**NONE.** Phase 4A already set up everything needed.

---

## 📁 Files to Create / Modify

### NEW files

#### `src/pages/CustomerOrders.tsx`
**Purpose:** Order history page, lazy-loaded.

Layout:
- Header (existing component)
- Page title: "ჩემი შეკვეთები" + back link to `/account`
- Loading state: skeleton cards (3 placeholders)
- Error state: error message, retry button
- Empty state: `<EmptyOrders />` (when `orders.length === 0`)
- Order list: `orders.map(o => <CustomerOrderCard key={o.id} order={o} />)`
- Container: `max-w-3xl mx-auto px-4 py-12`, rose background

**Imports:**
- `useCustomerOrders` from `@/hooks/useOrders`
- `useTranslation`
- `Header`, `SEO`
- New: `CustomerOrderCard`, `EmptyOrders`

#### `src/components/CustomerOrderCard.tsx`
**Purpose:** Single order, expandable accordion.

**Props:**
```ts
interface CustomerOrderCardProps {
  order: Order;  // from useOrders.ts
}
```

**Collapsed view:**
- Left column: Order ID short (last 8 chars), date (i18n-formatted), items count
- Right column: Status badge (color-coded), total price (rose color, NOT gold — gold reserved for the 6 spots)
- Click area: entire card, animated chevron rotates on expand
- Layout: `flex justify-between items-center p-5 rounded-2xl border border-rose-100 bg-white hover:shadow-md transition-all cursor-pointer`

**Expanded view (Framer Motion AnimatePresence):**
1. `<OrderStatusTimeline status={order.status} />`
2. Items list — for each `order_items[i]`:
   - 60x60 product thumbnail (image_url from products)
   - Name (localize ka/en/ru via current i18n.language)
   - Qty × price_at_time = subtotal
3. Delivery info card:
   - Customer name, phone, address (from order)
4. Footer: order total breakdown

**Status badge styling:**
```tsx
const statusStyles = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};
```

#### `src/components/OrderStatusTimeline.tsx`
**Purpose:** Horizontal stepper visual.

**Props:**
```ts
interface OrderStatusTimelineProps {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}
```

**Visual:**
- 3 normal steps: pending → processing → completed
- Each step: circle (28x28) + label below
- Connecting lines between circles
- Active step: rose-500 filled, white checkmark, ring
- Past steps: rose-300 filled, white checkmark
- Future steps: white bg, rose-200 border, no icon
- **Cancelled state:** show pending circle in red, X icon, line strikethrough red, rest greyed out + "შეკვეთა გაუქმდა" label below

**Step order index:**
```ts
const stepIndex = { pending: 0, processing: 1, completed: 2, cancelled: -1 };
```

#### `src/components/EmptyOrders.tsx`
**Purpose:** Empty state — no orders yet.

Layout:
- Centered `ShoppingBag` icon (lucide, size 64, rose-300)
- Heading: "თქვენ ჯერ არ გაქვთ შეკვეთები"
- Subtext: "გადადით კატალოგში და აღმოაჩინეთ თქვენი არომატი ✨"
- CTA button: "შეიძინე ახლა" → `Link to="/"` , rose-500 button
- Vertical padding `py-20`, rose tones

### MODIFIED files

#### `src/App.tsx`
Add the lazy import and route inside the existing `<Route element={<ProtectedCustomerRoute />}>` block:

```tsx
const CustomerOrders = lazy(() => import("./pages/CustomerOrders"));

// Inside ProtectedCustomerRoute element:
<Route path="/account/orders" element={
  <Suspense fallback={<AdminFallback />}><CustomerOrders /></Suspense>
} />
```

#### `src/pages/Account.tsx`
Replace the "Coming soon" block:

```tsx
// OLD:
<div className="bg-white rounded-[1.5rem] border border-rose-100 shadow-sm p-8">
  <div className="flex items-center gap-3 text-rose-400 mb-3">
    <ShoppingBag size={18} />
    <h2 className="font-display text-lg text-rose-500/80">{t('account.my_orders')}</h2>
  </div>
  <p className="font-body text-sm text-muted-foreground">{t('account.orders_coming_soon')} ✨</p>
</div>

// NEW: Link card to /account/orders
<Link to="/account/orders" className="block bg-white rounded-[1.5rem] border border-rose-100 shadow-sm p-8 hover:shadow-md hover:border-rose-200 transition-all group">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3 text-rose-400">
      <ShoppingBag size={18} />
      <h2 className="font-display text-lg text-rose-500/80 group-hover:text-rose-600">{t('account.my_orders')}</h2>
    </div>
    <ChevronRight size={18} className="text-rose-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
  </div>
  <p className="font-body text-sm text-muted-foreground mt-2">{t('account_orders.view_all')}</p>
</Link>
```

Note: import `ChevronRight` from lucide-react.

#### `src/components/UserMenu.tsx`
Change `header.my_orders` link target from `/account` to `/account/orders`:

```tsx
// Find this:
<DropdownMenuItem asChild>
  <Link to="/account" className="...">
    <ShoppingBag size={14} className="text-rose-300" />
    {t('header.my_orders')}
  </Link>
</DropdownMenuItem>

// Change to:
<DropdownMenuItem asChild>
  <Link to="/account/orders" className="...">
    <ShoppingBag size={14} className="text-rose-300" />
    {t('header.my_orders')}
  </Link>
</DropdownMenuItem>
```

Also remove the `text-muted-foreground` class — now it's a real link.

#### `src/i18n/translations.json`
Add per language (ka/en/ru) — three locations:

```json
"account_orders": {
  "title": "ჩემი შეკვეთები" / "My Orders" / "Мои заказы",
  "view_all": "ნახე ყველა შემოწმდე სტატუსები" / "View all and check statuses" / "Просмотрите все и проверьте статусы",
  "back_to_account": "ანგარიშზე დაბრუნება" / "Back to account" / "Назад к аккаунту",
  "order_number": "შეკვეთა #" / "Order #" / "Заказ #",
  "items_count_one": "1 ნივთი" / "1 item" / "1 товар",
  "items_count_other": "{{count}} ნივთი" / "{{count}} items" / "{{count}} товаров",
  "delivery_to": "მიწოდება" / "Delivery to" / "Доставка по адресу",
  "subtotal": "ქვეჯამი" / "Subtotal" / "Подытог",
  "loading_orders": "შეკვეთები იტვირთება..." / "Loading orders..." / "Загрузка заказов..."
},
"empty_orders": {
  "title": "თქვენ ჯერ არ გაქვთ შეკვეთები" / "No orders yet" / "Пока нет заказов",
  "subtitle": "გადადით კატალოგში და აღმოაჩინეთ თქვენი არომატი ✨" / "Explore our catalog and find your signature scent ✨" / "Перейдите в каталог и найдите свой аромат ✨",
  "cta": "შეიძინე ახლა" / "Shop now" / "Купить сейчас"
},
"order_status": {
  "pending": "მუშავდება" / "Pending" / "В обработке",
  "processing": "მზადდება" / "Processing" / "Готовится",
  "completed": "მიწოდებულია" / "Delivered" / "Доставлен",
  "cancelled": "გაუქმდა" / "Cancelled" / "Отменён"
}
```

---

## 🎨 Date Formatting

Use `Intl.DateTimeFormat` with i18n.language as locale:

```ts
const formatOrderDate = (iso: string | null, lang: string): string => {
  if (!iso) return '—';
  const localeMap = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU' };
  return new Intl.DateTimeFormat(localeMap[lang as keyof typeof localeMap] || 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
};
```

Place this as a small utility — inline in `CustomerOrderCard.tsx` (not worth a separate file).

---

## 🎨 Design Guidance (Hybrid C — preserve!)

- **Backgrounds:** `bg-rose-50/30` page, white cards, rose-100 borders
- **Status colors:** colored badges (yellow/blue/green/red) for clarity — these are functional colors, NOT brand
- **Total price:** rose-600 text (NOT gold — gold stays reserved for the 6 surgical spots)
- **Timeline active step:** rose-500 filled, white check, optional `shadow-[0_0_12px_rgba(244,63,94,0.4)]`
- **Animations:** Framer Motion fade-in cards, accordion expand/collapse smooth
- **Typography:** Cormorant Garamond for page title + order numbers, Montserrat body
- **Mobile:** cards stack vertically, timeline becomes vertical on `< sm` if needed

---

## 🔒 Security Notes

- RLS already enforces `user_id = auth.uid()` — no additional checks needed in queries
- Don't display `customer_email` if it equals other customers' emails (it shouldn't, but defensive)
- Don't expose other users' orders accidentally — `useCustomerOrders` is the only path; never use `useOrders()` (admin hook) here
- Status timeline is read-only — customers can't update order status

---

## 🧪 Acceptance Criteria

**Empty state (new customer):**
1. Customer signs up, navigates to `/account/orders`
2. Sees `<EmptyOrders />` with CTA button
3. Clicking CTA → `/` (homepage)

**Has orders (returning customer):**
1. Customer places order while logged in → `user_id` populated
2. Navigates to `/account/orders`
3. Sees list of their orders, newest first
4. Each card shows: order ID short, date, items count, status badge, total
5. Clicks card → expands smoothly, shows timeline + items + delivery info
6. Clicks again → collapses

**Status timeline:**
1. Pending order: only first step lit (rose-500), rest outlined
2. Processing: first two lit
3. Completed: all three lit
4. Cancelled: red X + red strikethrough on lines, "შეკვეთა გაუქმდა" label

**Mobile (sm breakpoint):**
1. Cards stack with same content, no horizontal scroll
2. Timeline remains horizontal (compact enough)
3. Touch tap expands cards

**Admin separation:**
1. Admin user (`axalierti5@gmail.com`) at `/account/orders` sees ONLY their personal orders (if they ever placed any while logged in)
2. Admin still uses `/admin/orders` for all orders — unchanged
3. UserMenu shows "Admin Panel" link for admin

**Navigation:**
1. From `/account` → click "My Orders" card → `/account/orders`
2. From header UserMenu → "My Orders" → `/account/orders`
3. `/account/orders` has back link → `/account`

**i18n:**
1. All 3 languages render correctly
2. Date format adapts per locale
3. Status labels translated

---

## 📦 Deliverable Sequence (Sonnet 4.6 execution order)

1. **Create `OrderStatusTimeline.tsx`** — start with the smallest, most reusable component
2. **Create `EmptyOrders.tsx`** — simple, no dependencies
3. **Create `CustomerOrderCard.tsx`** — uses OrderStatusTimeline
4. **Create `CustomerOrders.tsx`** — uses both components above + `useCustomerOrders`
5. **Add i18n keys** — ka/en/ru (3 sections: account_orders, empty_orders, order_status)
6. **Update `App.tsx`** — lazy import + route
7. **Update `Account.tsx`** — replace "Coming soon" with link card
8. **Update `UserMenu.tsx`** — fix `/account` → `/account/orders` link target
9. **TypeScript check** — `npx tsc --noEmit`
10. **Build** — `bun run build`
11. **Manual smoke test** — empty state + (place 1-2 orders + view them)
12. **Commit + push** — single descriptive commit
13. **Verify Vercel** — production URL works
14. **Report back** with results + open questions

---

## ⚠️ Watch Out For

- **`Order` type:** uses string literal union `'pending' | 'processing' | 'completed' | 'cancelled'`. Don't widen to `string`.
- **`order.order_items` array:** can be `undefined` if query didn't populate — guard with `?.` and `?? []`.
- **`product` nested object:** `name_ka` is NOT NULL, but `name_en`, `name_ru`, `image_url` are nullable. Use the same localize fallback as `useProducts.ts`.
- **`order.id` UUID:** display only last 8 chars for human-friendly short ID: `order.id.slice(-8).toUpperCase()`.
- **Lazy loading:** `CustomerOrders` is lazy-imported — wrap in `<Suspense fallback={<AdminFallback />}>`.
- **TanStack Query staleTime:** existing `useCustomerOrders` is 15s — leave as-is.
- **Don't introduce gold:** total price text MUST use rose tones (e.g. `text-rose-600`). Gold is locked to the 6 spots from Hybrid C.
- **i18next pluralization:** for `items_count_one` / `items_count_other`, use i18n's plural syntax: `t('account_orders.items_count', { count: items.length })`.

---

## 🚦 Hand-off Protocol — CRITICAL

**▸ BLOCKER triggers** (stop work, escalate to Opus 4.7):
- Order type definition needs widening that affects admin code
- RLS doesn't allow some query you need (means schema change required)
- Design tradeoff not covered above
- Any "should I…?" question not in spec
- Format: `🚨 Senior Fullstack Opus 4.7-ის შემოსვლა მჭირდება — blocker: [აღწერე]`

**▸ Phase 4B COMPLETE** (after all 14 deliverables + Vercel verify):
```
🔄 გადართე Opus 4.7-ზე — Phase 4B done. Ready for:
   - Code review by Senior Architect
   - Phase 4C planning (Admin Analytics Dashboard)
```

Never start Phase 4C autonomously.

---

## 📊 Report Format (when complete)

When done, report:
- Which deliverables completed, which blocked
- Test results: empty state + has-orders flow
- Mobile screenshot OR mobile breakpoint sanity check
- Any deviation from spec + reason
- Production URL where verified
- Open questions for Opus

---

## 🚦 After Phase 4B → Phase 4C Preview

**Phase 4C — Admin Analytics Dashboard** (next, with Opus design)
- `/admin/analytics` page
- Sales overview cards: total revenue, order count, average order value, top product
- Time-range toggle: 7d / 30d / 90d / all
- Recharts bar chart: orders per day
- Top 5 products by revenue
- Independent of Phase 4B — could parallel-build if needed

Phase 4D — Auth polish (Google OAuth + password reset + MFA + leaked-password protection)
