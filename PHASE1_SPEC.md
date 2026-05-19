# 🛡 Phase 1 — Foundation Hardening
## Execution Specification for Sonnet 4.6

> **Authored by:** Claude Opus 4.7 (Senior Architect)
> **Executor:** Claude Sonnet 4.6 (Builder)
> **Date:** 2026-05-19
> **Project:** AVON2FLAME · Supabase ref: `rhfzdzipciasljblbmtf`

---

## 🎯 Goal of Phase 1

Transform the database from "RLS in name only" (27 `USING (true)` policies) into a production-grade Supabase security posture:

1. ✅ Strict RLS policies — anon read-only on public catalog, admin-only on writes
2. ✅ Supabase Auth replaces hardcoded sessionStorage credentials
3. ✅ `create_order` rewritten as `SECURITY INVOKER` + stock decrement + validation
4. ✅ Storage policies tightened (no listing, no anon writes)
5. ✅ Excessive table GRANTs revoked from `anon`
6. ✅ Frontend Admin uses `useAuth` hook + `ProtectedRoute`
7. ✅ All changes versioned in `supabase/migrations/`
8. ✅ `get_advisors` reports zero `USING(true)` write policies, zero anon-executable SECURITY DEFINER

---

## 📐 Architectural Decisions (locked in)

| Decision | Choice |
|---|---|
| Admin identity model | `profiles` table + `is_admin boolean` |
| Auth method | Email + password (manually chosen by Product Owner) |
| Anonymous sign-ins | **DISABLED** in Supabase Auth settings |
| Email confirmation | **DISABLED** for Phase 1 |
| Guest checkout | **KEPT** — `create_order` callable by anon via tightened RPC |
| Anonymous order viewing | **BLOCKED** — order tracking deferred to Phase 3 |
| Password policy | Min 8 chars, 1 digit |
| MFA | Deferred to Phase 4 |

---

## 🧾 Execution Order

### **Step 0 — Baseline & Backup** (Sonnet)
0.1. `git init` in project root
0.2. Add `.gitignore` (Node + Supabase + IDE)
0.3. Initial commit: `chore: baseline before Phase 1 hardening`
0.4. Verify Supabase auto-backups are enabled (Dashboard → Database → Backups). No action required if already on.

### **Step 1 — Migrations folder structure** (Sonnet)
1.1. Create folder `supabase/migrations/`
1.2. Create `supabase/config.toml` if not present (CLI use later)
1.3. Each migration below = one timestamped file in this folder using format `YYYYMMDDHHMMSS_short_name.sql`

> ⚠️ **Apply via MCP `apply_migration` for each file** — do not bundle multiple migrations. One file = one logical change.

### **Step 2 — Create `profiles` table** (Sonnet)
Migration: `20260519_140000_create_profiles_table.sql`

```sql
-- Profiles table for users (admins and future customers)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Index for admin lookups (hot path in every RLS check)
CREATE INDEX idx_profiles_is_admin ON public.profiles(id) WHERE is_admin = true;

-- Function to check if current user is admin (cached per transaction)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND is_admin = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles RLS
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid()) OR public.is_admin()
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

### **Step 3 — Create admin user** (Product Owner, manual)

🛑 **STOP — wait for Product Owner.** Sonnet does NOT proceed past Step 2 without the admin user being created.

**Product Owner action (one of these):**

**Option A — via Supabase Dashboard (recommended):**
1. Go to Authentication → Users → "Add user"
2. Choose method: "Create new user"
3. Enter email + password (your choice)
4. Toggle "Auto Confirm User" → ON (since email confirmation is disabled in Phase 1)
5. After creation, go to SQL Editor and run:
   ```sql
   UPDATE public.profiles
   SET is_admin = true, full_name = 'Owner'
   WHERE email = 'YOUR_ADMIN_EMAIL_HERE';
   ```

**Option B — via SQL Editor only (faster):**
```sql
-- Replace placeholders before running
SELECT auth.create_user(
  email := 'YOUR_ADMIN_EMAIL',
  password := 'YOUR_STRONG_PASSWORD',
  email_confirm := true
);

UPDATE public.profiles
SET is_admin = true, full_name = 'Owner'
WHERE email = 'YOUR_ADMIN_EMAIL';
```

**Verification:**
```sql
SELECT id, email, is_admin FROM public.profiles WHERE is_admin = true;
-- Must return exactly 1 row
```

### **Step 4 — Replace RLS policies on existing tables** (Sonnet)

> ⚠️ **Critical:** apply one table at a time, verify before next.

#### 4.1 `products` — migration `20260519_140100_rls_products.sql`
```sql
-- Drop all old policies
DROP POLICY IF EXISTS "Public manage products" ON public.products;
DROP POLICY IF EXISTS "Auth manage products" ON public.products;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;

-- New policies
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

#### 4.2 `categories` — migration `20260519_140200_rls_categories.sql`
```sql
DROP POLICY IF EXISTS "Public manage categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;

CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

#### 4.3 `catalogs` — migration `20260519_140300_rls_catalogs.sql`
```sql
DROP POLICY IF EXISTS "Public Manage" ON public.catalogs;
DROP POLICY IF EXISTS "Public Select" ON public.catalogs;

CREATE POLICY "catalogs_public_read" ON public.catalogs
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "catalogs_admin_write" ON public.catalogs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

#### 4.4 `catalog_pages` — migration `20260519_140400_rls_catalog_pages.sql`
```sql
DROP POLICY IF EXISTS "Public manage catalog_pages" ON public.catalog_pages;
DROP POLICY IF EXISTS "Public read catalog_pages" ON public.catalog_pages;

CREATE POLICY "catalog_pages_public_read" ON public.catalog_pages
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "catalog_pages_admin_write" ON public.catalog_pages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

#### 4.5 `orders` — migration `20260519_140500_rls_orders.sql`
```sql
DROP POLICY IF EXISTS "Auth manage orders" ON public.orders;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.orders;

-- Admin: full CRUD
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NO anon SELECT/INSERT/UPDATE/DELETE policy. Orders created exclusively via create_order RPC.
```

#### 4.6 `order_items` — migration `20260519_140600_rls_order_items.sql`
```sql
DROP POLICY IF EXISTS "Auth manage items" ON public.order_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_items;

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NO anon policy. Items created exclusively via create_order RPC.
```

### **Step 5 — REVOKE excessive table GRANTs** (Sonnet)
Migration: `20260519_140700_revoke_anon_grants.sql`

```sql
-- Remove dangerous privileges anon should never have
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public FROM anon;

-- Re-grant only what's needed
GRANT SELECT ON public.products, public.categories, public.catalogs, public.catalog_pages TO anon;

-- Authenticated keeps full DML potential (RLS policies will gate actual access)
-- service_role untouched (bypasses RLS, used by Edge Functions only)

-- Verify
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'anon still has DML grants on % rows', v_count;
  END IF;
END $$;
```

### **Step 6 — Rewrite `create_order` RPC** (Sonnet)
Migration: `20260519_140800_rewrite_create_order.sql`

```sql
-- Drop the dangerous SECURITY DEFINER version
DROP FUNCTION IF EXISTS public.create_order(text, text, text, numeric, json);

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER  -- still DEFINER because anon must INSERT into orders, which they have no policy for
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_price numeric;
  v_total numeric := 0;
  v_stock int;
  v_product_name text;
BEGIN
  -- 1. Input validation
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid customer name';
  END IF;

  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) < 5 THEN
    RAISE EXCEPTION 'Invalid customer phone';
  END IF;

  IF p_customer_address IS NULL OR length(trim(p_customer_address)) < 3 THEN
    RAISE EXCEPTION 'Invalid customer address';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Too many items in one order';
  END IF;

  -- 2. Validate each item: product exists, has stock, server-side price calculation
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    -- Lock product row to prevent race conditions on stock
    SELECT price, stock_quantity, name
      INTO v_price, v_stock, v_product_name
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_product_name, v_quantity, v_stock;
    END IF;

    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  -- 3. Create order with SERVER-CALCULATED total (never trust client)
  INSERT INTO public.orders (
    customer_name, customer_phone, customer_address, total_price, status
  ) VALUES (
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_customer_address),
    v_total,
    'pending'
  )
  RETURNING id INTO v_order_id;

  -- 4. Insert items + decrement stock atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    SELECT price INTO v_price FROM public.products WHERE id = v_product_id;

    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_time)
    VALUES (v_order_id, v_product_id, v_quantity, v_price);

    UPDATE public.products
    SET stock_quantity = stock_quantity - v_quantity
    WHERE id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- Lock down execution
REVOKE EXECUTE ON FUNCTION public.create_order(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, jsonb) TO anon, authenticated;
```

> 📌 **Note for frontend change:** old signature was `(name, phone, address, total, items)` — new signature drops `total` (server-calculated) and accepts `jsonb` instead of `json`. `src/pages/Checkout.tsx:46` must update.

### **Step 7 — Storage policies tightening** (Sonnet)
Migration: `20260519_140900_storage_policies.sql`

```sql
-- Drop all old over-permissive storage policies
DROP POLICY IF EXISTS "Public manage storage" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Select" ON storage.objects;
DROP POLICY IF EXISTS "Public View 1ifhysk_0" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload 1ifhysk_0" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload 1ifhysk_1" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload 1ifhysk_2" ON storage.objects;

-- Public read for object URLs (does NOT enable listing — that requires bucket-level)
CREATE POLICY "objects_public_read_products" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'products');

CREATE POLICY "objects_public_read_catalogs" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'catalogs');

-- Admin-only writes
CREATE POLICY "objects_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('products', 'catalogs') AND public.is_admin()
  );

CREATE POLICY "objects_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('products', 'catalogs') AND public.is_admin())
  WITH CHECK (bucket_id IN ('products', 'catalogs') AND public.is_admin());

CREATE POLICY "objects_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('products', 'catalogs') AND public.is_admin());
```

> 📝 **Note:** Buckets remain `public` (objects accessible by URL without auth) but listing requires admin. This matches the existing image-by-URL workflow in `ProductCard.tsx`.

### **Step 8 — Disable Anonymous Sign-ins** (Product Owner, manual)

🛑 In Supabase Dashboard:
1. Authentication → Providers → Email → enable, "Confirm email" OFF for Phase 1
2. Authentication → Providers → Anonymous sign-ins → **DISABLED**
3. Authentication → Policies → Password requirements → min 8, require digit

### **Step 9 — Frontend `useAuth` hook** (Sonnet)
File: `src/hooks/useAuth.tsx` (new)

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdminFlag = async (uid: string | undefined) => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', uid)
      .maybeSingle();
    setIsAdmin(!!data?.is_admin);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await refreshAdminFlag(session?.user?.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      await refreshAdminFlag(newSession?.user?.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### **Step 10 — Wrap App with `AuthProvider`** (Sonnet)
File: `src/App.tsx`

Add `<AuthProvider>` between `<TooltipProvider>` and `<CartProvider>`.

### **Step 11 — `ProtectedAdminRoute` component** (Sonnet)
File: `src/components/ProtectedAdminRoute.tsx` (new)

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

export const ProtectedAdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### **Step 12 — Refactor Admin login** (Sonnet)
File: `src/pages/Admin.tsx`

Replace the hardcoded `handleLogin` (lines 906-917) with `useAuth().signIn(email, password)`. Replace `sessionStorage.getItem('admin_auth')` checks with `useAuth().user && useAuth().isAdmin`. Delete the entire `loginData`/`isAuthenticated` state.

Wrap the `/admin` route in `App.tsx` with `ProtectedAdminRoute`, and add a new `/admin/login` route that contains just the login form (extract from Admin.tsx).

### **Step 13 — Update `Checkout.tsx` for new `create_order` signature** (Sonnet)
File: `src/pages/Checkout.tsx` line 46

```tsx
// Before
const { error: rpcError } = await supabase.rpc('create_order', {
  p_customer_name: formData.name,
  p_customer_phone: formData.phone,
  p_customer_address: formData.address,
  p_total_amount: totalPrice,  // ❌ remove
  p_items: cart.map(item => ({
    product_id: item.id,
    quantity: item.quantity,
    price_at_time: item.price  // ❌ no longer used server-side
  }))
});

// After
const { error: rpcError } = await supabase.rpc('create_order', {
  p_customer_name: formData.name,
  p_customer_phone: formData.phone,
  p_customer_address: formData.address,
  p_items: cart.map(item => ({
    product_id: item.id,
    quantity: item.quantity
  }))
});
```

### **Step 14 — Replace `window.location.reload()` with query invalidation** (Sonnet)
Files: `src/pages/Admin.tsx` (4 locations: lines 587, 667, 698, 725)

For each occurrence, replace with:
```tsx
import { useQueryClient } from '@tanstack/react-query';
// ...
const queryClient = useQueryClient();
// On success:
await queryClient.invalidateQueries({ queryKey: ['products'] });
// (or 'orders', 'categories' as appropriate)
```

> ⚠️ This requires `useProducts`, `useOrders`, `useCategories` to use TanStack Query keys. If they use plain `useState`, that's a Phase 2 refactor — for Phase 1, keep `window.location.reload()` for now. Document this in commit.

### **Step 15 — Add FK indexes** (Sonnet)
Migration: `20260519_141000_add_fk_indexes.sql`

```sql
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
```

### **Step 16 — Verification** (Sonnet)

Run via MCP:
```
mcp__supabase__get_advisors type=security
mcp__supabase__get_advisors type=performance
```

**Acceptance criteria:**
- ✅ Zero `rls_policy_always_true` warnings on write actions
- ✅ Zero `anon_security_definer_function_executable` for sensitive functions
- ✅ Zero `multiple_permissive_policies` warnings
- ✅ No new errors introduced

End-to-end test:
1. Logged out (anon) → can view products, categories, catalogs ✅
2. Logged out → cannot SELECT from orders directly ✅
3. Logged out → checkout RPC works (creates order, decrements stock) ✅
4. Logged in as admin → can manage products/orders ✅
5. Logged in as non-admin (if any) → cannot access admin features ✅

---

## 🚫 Out of Scope for Phase 1 (do NOT do)

- Magic link auth (Phase 4)
- Customer profiles & order history (Phase 4)
- Schema cleanup of `name` vs `name_ka/en/ru` (Phase 2)
- Admin.tsx file split (Phase 2)
- Image optimization (Phase 3)
- Visual redesign (Phase 3)

---

## ✅ Definition of Done

- [ ] All 12 migrations applied successfully via MCP
- [ ] Admin user created with chosen credentials
- [ ] Anonymous sign-ins disabled in Dashboard
- [ ] `useAuth` hook + `ProtectedAdminRoute` integrated
- [ ] Admin.tsx login uses Supabase Auth
- [ ] Checkout.tsx uses new `create_order` signature
- [ ] FK indexes added
- [ ] `get_advisors security` returns zero `USING(true)` write warnings
- [ ] `get_advisors performance` improves (multiple_permissive_policies cleared)
- [ ] Manual smoke test passes (anon view, anon checkout, admin login, admin CRUD)
- [ ] Git commit per migration applied + final commit `feat: complete Phase 1 hardening`

---

## 📝 Sonnet's Execution Notes

- After each migration: run `mcp__supabase__execute_sql` with a quick verification query (e.g., `SELECT policyname FROM pg_policies WHERE tablename='X'`) to confirm the policies match the spec.
- Commit per logical chunk (e.g., one commit for profiles, one for each table's RLS, one for storage, one for the RPC, one for frontend changes).
- If a migration fails partway, **do not improvise** — pause and check with Opus.
- `window.location.reload()` is fine to keep for Phase 1 if invalidation is complex; document and move on.
- If frontend breaks after backend migration (RLS too strict), check whether `is_admin()` returns true for the logged-in admin user.

---

*🔚 End of Phase 1 Spec · Hand-off to Sonnet 4.6 ready*
