# Phase 4A — Customer Accounts Foundation

**Architect:** Claude Opus 4.7
**Executor:** Claude Sonnet 4.6
**Created:** 2026-05-23
**Status:** READY TO EXECUTE

---

## 🎯 Goal

Add customer account system: signup, login, profile, header user menu. Guest checkout preserved. Foundation for Phase 4B (order history).

**Non-goals (deferred):**
- Google OAuth → Phase 4B
- Order history page → Phase 4B (DB columns prepared now, UI later)
- Password reset flow → Phase 4D
- Email confirmation flow → toggle ON for production at end of 4A

---

## 📊 Current State (verified via Supabase MCP, 2026-05-23)

**`profiles` table (already exists):**
- `id uuid PK FK → auth.users.id`
- `email text UNIQUE`
- `full_name text`
- `is_admin boolean DEFAULT false`
- `created_at`, `updated_at` timestamptz

**`orders` table:**
- `id`, `customer_email`, `customer_name`, `customer_phone`, `customer_address`, `total_price`, `status`, `created_at`
- ⚠️ NO `user_id` column yet — must add

**RLS state:**
- `orders` / `order_items`: admin-only (`is_admin()`) — must add "customer own" policy
- `profiles`: own row OR admin (already correct)

**`useAuth.tsx`:**
- Has `signIn`, `signOut`, `isAdmin`. Missing: `signUp`, profile data.

---

## 🗄️ Database Migration (Step 1)

**Apply via Supabase MCP `apply_migration` — name: `phase4a_customer_accounts`**

```sql
-- 1. Extend profiles with phone + default_address
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS default_address text;

-- 2. Add user_id to orders (nullable — guest checkout preserved)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 3. RLS: customers can SELECT own orders
DROP POLICY IF EXISTS "orders_customer_select_own" ON public.orders;
CREATE POLICY "orders_customer_select_own" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. RLS: customers can INSERT own orders (Phase 4B uses this)
DROP POLICY IF EXISTS "orders_customer_insert_own" ON public.orders;
CREATE POLICY "orders_customer_insert_own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 5. RLS: customers can SELECT own order_items (via order ownership)
DROP POLICY IF EXISTS "order_items_customer_select_own" ON public.order_items
;
CREATE POLICY "order_items_customer_select_own" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- 6. Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Update create_order RPC to accept optional user_id
-- (Sonnet: read existing create_order definition first, then patch p_user_id parameter)
```

**Important RPC change** — `create_order` must accept `p_user_id uuid DEFAULT NULL` parameter and write it into `orders.user_id`. Sonnet: query existing RPC source with `SELECT pg_get_functiondef('public.create_order'::regproc);` then patch.

---

## 📁 Files to Create / Modify

### NEW files

#### `src/pages/auth/Signup.tsx`
- Email + password + full_name + phone fields (React Hook Form + Zod)
- `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
- On success: toast "მოგესალმებით!" → redirect `/account`
- Trigger auto-creates `profiles` row (no manual insert needed)
- Rose/pink design language (NOT gold — those are reserved for 6 spots only)

#### `src/pages/auth/Login.tsx`
- Email + password
- `signIn(email, password)` from useAuth
- Link to `/auth/signup`
- "Forgot password?" → placeholder (Phase 4D)
- On success: redirect to `?next=` query param or `/account`

#### `src/pages/Account.tsx`
- Display profile data (full_name, email, phone, default_address)
- Edit form (save updates `profiles` table)
- "View order history" link → `/account/orders` (placeholder for now: "Coming soon — Phase 4B")
- Logout button

#### `src/components/UserMenu.tsx`
- Dropdown (Radix `DropdownMenu`)
- Logged out: "შესვლა" / "რეგისტრაცია" buttons (links)
- Logged in: avatar circle (first letter of name) → menu items: `ჩემი ანგარიში` / `შეკვეთები` / `გასვლა`
- Mobile-friendly

#### `src/components/ProtectedCustomerRoute.tsx`
- Like `ProtectedAdminRoute` but checks `user !== null` (any logged-in user, admin or customer)
- If not logged in → redirect `/auth/login?next=<current>`

### MODIFIED files

#### `src/hooks/useAuth.tsx`
Add:
```ts
signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
profile: ProfileData | null;  // { full_name, phone, default_address }
refreshProfile: () => Promise<void>;
```

Implementation:
- `signUp` → `supabase.auth.signUp` with `options.data.full_name`
- After auth state change, fetch profile (full_name, phone, default_address) into context state
- Expose `refreshProfile()` for Account.tsx to call after update

#### `src/App.tsx`
Add routes:
```tsx
<Route path="/auth/signup" element={<Signup />} />
<Route path="/auth/login" element={<Login />} />
<Route element={<ProtectedCustomerRoute />}>
  <Route path="/account" element={<Account />} />
</Route>
```

Pages `Signup`/`Login` should be **eagerly imported** (small, frequently used). `Account` can be lazy.

#### `src/components/Header.tsx`
- Add `<UserMenu />` next to cart icon
- Mobile menu: include user options

#### `src/pages/Checkout.tsx`
- If `user && profile`: pre-fill name/phone/address from profile (editable)
- Add checkbox: "შენახე ეს მისამართი ჩემს პროფილში" (when logged in)
- Call `create_order` with `p_user_id: user?.id ?? null`
- Guest checkout: works exactly as before

#### `src/hooks/useOrders.ts`
- Add `useCustomerOrders()` hook — fetches `orders WHERE user_id = auth.uid()` (RLS handles it)
- Keep existing `useOrders()` for admin

#### `src/i18n/translations.json`
Add keys (ka/en/ru):
- `auth.signup_title`, `auth.login_title`, `auth.email`, `auth.password`, `auth.full_name`, `auth.phone`, `auth.signup_button`, `auth.login_button`, `auth.have_account`, `auth.no_account`, `auth.welcome`
- `account.title`, `account.my_orders`, `account.logout`, `account.save_address`, `account.profile_updated`
- `header.login`, `header.signup`, `header.my_account`, `header.my_orders`, `header.logout`

---

## 🎨 Design Guidance (Hybrid C — preserve!)

- **Auth pages background:** Rose gradient (`bg-rose-50/30`), white card center, rose-500 CTA buttons
- **Form inputs:** existing shadcn `Input` with rose focus ring
- **DO NOT use gold** — gold is reserved for the 6 surgical spots only
- **Animations:** Framer Motion fade-in on form (consistent with existing pages)
- **Typography:** Cormorant Garamond for headings, Montserrat body

---

## 🔒 Security Checklist

- [ ] Supabase Email Confirmation: OFF during development, ON for production (Supabase Dashboard → Auth → Settings)
- [ ] `profiles` RLS: existing policies suffice (own row OR admin) — DO NOT change
- [ ] `orders` RLS: new `customer_select_own` + `customer_insert_own` policies are ADDITIVE to existing admin policy
- [ ] `handle_new_user` trigger: SECURITY DEFINER + `SET search_path = public` (prevents search_path attacks)
- [ ] Never expose `is_admin` field through customer-facing UI
- [ ] `Account.tsx` UPDATE: client can only update own row (RLS enforces) — explicitly only set `full_name`, `phone`, `default_address` (NOT `is_admin`)

---

## 🧪 Acceptance Criteria

**Signup flow:**
1. User visits `/auth/signup`, fills form, submits
2. Supabase Auth creates user, trigger creates `profiles` row with `is_admin = false`
3. User auto-logged-in, redirected to `/account`
4. `/account` shows their name and email

**Login flow:**
1. User visits `/auth/login`, enters credentials
2. On success, redirect to `?next=` or `/account`
3. Header now shows UserMenu with avatar

**Checkout flow (logged in):**
1. Cart → Checkout → form pre-filled from profile
2. Submit → order saved with `user_id` populated
3. Order visible to user (Phase 4B) and to admin

**Checkout flow (guest):**
1. No login required
2. Order saved with `user_id = NULL`
3. Admin sees order normally

**Admin separation:**
1. `axalierti5@gmail.com` login still works at `/admin/login`
2. Admin can also be logged in as "user" view (sees their `/account`)
3. Admin Orders page unchanged

**Header:**
1. Logged out: "შესვლა" button visible
2. Logged in: avatar dropdown with menu items
3. Admin user sees additional "Admin Panel" link in dropdown

---

## 📦 Deliverable Sequence (Sonnet 4.6 execution order)

1. **DB migration** — apply via Supabase MCP `apply_migration`
2. **Verify migration** — `list_tables` to confirm columns + policies exist
3. **Update `useAuth.tsx`** — add signUp, profile, refreshProfile
4. **Create `ProtectedCustomerRoute.tsx`**
5. **Create `Signup.tsx`, `Login.tsx`, `Account.tsx`**
6. **Create `UserMenu.tsx`**
7. **Update `Header.tsx`** — wire UserMenu
8. **Update `App.tsx`** — wire routes
9. **Update `Checkout.tsx`** — profile pre-fill + user_id pass-through
10. **Update `create_order` RPC** — accept `p_user_id`
11. **Update `useOrders.ts`** — add `useCustomerOrders()` (data layer ready for 4B)
12. **i18n translations** — add ka/en/ru keys
13. **Test full flow** — signup → login → checkout (logged in + guest) → account edit
14. **Commit + push** — single descriptive commit
15. **Report back** — full test results + any open questions

---

## ⚠️ Watch Out For

- **Existing admin user** (`axalierti5@gmail.com`): when migration runs, trigger fires only on NEW signups — existing admin row already has `is_admin = true`, NOT overwritten. Safe.
- **`create_order` RPC**: it's `SECURITY DEFINER` — when patching, do NOT remove that. Just add the optional parameter.
- **i18next default lang**: Georgian. New translations must include all 3 langs.
- **Suspense loading**: Account page is lazy — use existing `AdminFallback`-style fallback component (or generic one).
- **Mobile responsiveness**: UserMenu must work in mobile hamburger menu too.

---

## 🚦 Hand-off

When Phase 4A is complete:
- All 15 deliverables done
- Tests pass (manual smoke test minimum)
- Committed to `master` and pushed
- Vercel auto-deploys → verify on production URL
- **Then user switches back to Opus 4.7** for Phase 4B planning (order history UI)
