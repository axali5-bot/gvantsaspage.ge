# 🏗 Phase 2 — Architecture & Code Quality
## Execution Specification for Sonnet 4.6

> **Authored by:** Claude Opus 4.7 (Senior Architect)
> **Executor:** Claude Sonnet 4.6 (Builder)
> **Date:** 2026-05-20
> **Project:** AVON2FLAME · Supabase ref: `rhfzdzipciasljblbmtf`
> **Prerequisite:** Phase 1 complete (commit `d33bf82` or later)

---

## 🎯 Goal of Phase 2

Transform the codebase from "works but messy" into a production-grade architecture:

1. ✅ Schema normalized — single source of truth for product names/descriptions per language
2. ✅ All data fetching via **TanStack Query** — zero `window.location.reload()`
3. ✅ Admin split into **sub-routes** (`/admin/products`, `/admin/orders`, etc.) — no more 1387-line monolith
4. ✅ **Real multilingual UX** — 3 language tabs in product form with "Copy from Georgian" helper
5. ✅ Zero `as any` casts in new code — proper Supabase types regenerated
6. ✅ TypeScript checks pass, advisors clean, manual smoke test passes

---

## 📐 Architectural Decisions (locked in)

| Decision | Choice | Rationale |
|---|---|---|
| Multilingual data model | **Keep 3-column schema** (`name_ka`, `name_en`, `name_ru`) | Existing column structure is sound — just unused |
| Legacy `name`/`description` columns | **DROP** from products table | All 40 rows have `name = name_ka` duplicate; redundant |
| Primary language column | `name_ka` becomes **NOT NULL** | Georgian is primary; others have fallback chain |
| Empty translation fallback | `name_ka → name_en → name_ru → ''` | Defined in `useProducts` mapper |
| Admin form | **3-tab UI** (Georgian, English, Russian) + "Copy from Georgian" button | Best UX/effort trade-off |
| Admin routing | **Sub-routes via React Router nested layout** | URL state, browser back, lazy mount per tab |
| Data fetching | **TanStack Query** for all reads + mutations | Already installed, replaces `window.location.reload()` |
| `as any` casts | Replaced with generated Supabase types | Type safety regression cleanup |
| Old `Admin.tsx` | **Deleted** at end of Phase 2 | Replaced entirely by new modular pages |

---

## 📦 New Folder Layout

```
src/pages/
├── admin/                          (NEW)
│   ├── AdminLayout.tsx             — shared shell: header, tabs nav, <Outlet />
│   ├── AdminProducts.tsx           — products tab page
│   ├── AdminOrders.tsx             — orders tab page
│   ├── AdminCategories.tsx         — categories tab page (wraps CategoryManager)
│   └── AdminCatalogs.tsx           — catalogs tab page (wraps CatalogManagerProject)
├── AdminLogin.tsx                  (existing, unchanged)
├── Index.tsx                       (existing — consumes useProducts via useQuery now)
├── Checkout.tsx                    (existing, unchanged)
└── ...

src/components/admin/               (NEW)
├── ProductFormDialog.tsx           — add/edit product (3-language tabs)
├── ProductDeleteDialog.tsx
├── ProductBulkDeleteDialog.tsx
├── ProductImportDialog.tsx         — CSV import (extracted)
├── ProductExportButtons.tsx        — CSV + Excel export (extracted)
├── ProductTable.tsx                — search + sort + pagination
└── OrderRow.tsx                    — moved from inline in old Admin.tsx

src/hooks/
├── useAuth.tsx                     (existing, unchanged)
├── useCart.tsx                     (existing, unchanged)
├── useProducts.ts                  ← rewritten as TanStack Query
├── useCategories.ts                ← rewritten as TanStack Query
└── useOrders.ts                    ← rewritten as TanStack Query

src/pages/Admin.tsx                 ❌ DELETED at end
```

---

## 🧾 Execution Order

> ⚠️ **Commit after each logical step.** If anything blocks for > 2 attempts, pause and ask Opus.

### **Step 0 — Pre-flight** (Sonnet)
0.1. Verify on `master` branch, working tree clean: `git status`
0.2. `git log --oneline -5` — confirm last commit is Phase 1 cleanup
0.3. Run `npm run build` (or `bun run build`) to confirm baseline builds clean
0.4. If build fails, **stop** and report

### **Step 1 — Drop legacy `name`/`description` columns** (Sonnet, MCP)
Migration: `20260520_100000_drop_legacy_name_description.sql`

> ⚠️ **Order matters:** must update `create_order` RPC FIRST (it references `name`), then drop columns.

**Substep 1.1 — Update `create_order` to use `name_ka`:**
```sql
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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
  -- (validation block unchanged — keep all the IF/RAISE checks from Phase 1)
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

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    -- 🔧 Use name_ka (with fallback) instead of legacy `name`
    SELECT price, stock_quantity, COALESCE(name_ka, name_en, name_ru, '')
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
```

**Substep 1.2 — Backfill any null `name_ka`:**
```sql
UPDATE public.products
SET name_ka = COALESCE(name_ka, name_en, name_ru, name, 'Unnamed Product')
WHERE name_ka IS NULL OR length(trim(name_ka)) = 0;
```

**Substep 1.3 — Make `name_ka` NOT NULL:**
```sql
ALTER TABLE public.products
  ALTER COLUMN name_ka SET NOT NULL;
```

**Substep 1.4 — Drop legacy columns:**
```sql
ALTER TABLE public.products DROP COLUMN name;
ALTER TABLE public.products DROP COLUMN description;
```

**Substep 1.5 — Verify:**
```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;
-- Confirm: name, description not in list; name_ka is_nullable = NO

SELECT COUNT(*) FILTER (WHERE name_ka IS NULL) AS null_count FROM public.products;
-- Must be 0
```

> 📌 Commit: `feat(db): drop legacy name/description columns, name_ka becomes primary`

### **Step 2 — Regenerate Supabase types** (Sonnet, MCP)
2.1. Call `mcp__supabase__generate_typescript_types`
2.2. Save returned content to `src/types/supabase.ts` (overwrite existing)
2.3. Verify: `npx tsc --noEmit` should still pass after this (most type errors will be in Admin.tsx, which we'll rewrite anyway — temporary `// @ts-expect-error` is fine in old Admin.tsx until Step 14)

> 📌 Commit: `chore: regenerate Supabase TypeScript types`

### **Step 3 — Rewrite `useProducts` with TanStack Query** (Sonnet)
File: `src/hooks/useProducts.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Product {
  id: string;
  name_ka: string;
  name_en: string | null;
  name_ru: string | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  stock_quantity: number | null;
  created_at: string;
  gender: string | null;
  /** Derived: best-available name for current UI language. Filled by useProducts. */
  name: string;
  /** Derived: best-available description for current UI language. */
  description: string;
}

export interface ProductInput {
  name_ka: string;
  name_en?: string;
  name_ru?: string;
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
  price: number;
  image_url: string;
  category_id: string | null;
  stock_quantity: number;
  gender?: string;
}

const PRODUCTS_KEY = ['products'] as const;

const localize = (row: any): Product => ({
  ...row,
  name: row.name_ka || row.name_en || row.name_ru || '',
  description: row.description_ka || row.description_en || row.description_ru || '',
});

export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: PRODUCTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(localize);
    },
    staleTime: 30_000,
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery<Product | null>({
    queryKey: ['products', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? localize(data) : null;
    },
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const { data, error } = await supabase.from('products').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProductInput> }) => {
      const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
};

export const useBulkDeleteProducts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
};
```

> 📌 **Breaking change:** consumers used to do `const { products, loading, error } = useProducts()`. New signature: `const { data: products = [], isLoading, error } = useProducts()`. Update `Index.tsx`, `ProductDetails.tsx`, etc. in this same commit.

> 📌 Commit: `refactor(hooks): migrate useProducts to TanStack Query with CRUD mutations`

### **Step 4 — Rewrite `useCategories`** (Sonnet)
File: `src/hooks/useCategories.ts`

Same pattern. Expose:
- `useCategories()` — returns `data: Category[]`
- `useCreateCategory()` — mutation
- `useUpdateCategory()` — mutation
- `useDeleteCategory()` — mutation

Update consumers: `CategoryManager.tsx`, `QuickAddCategory.tsx`, `Header.tsx`, `Index.tsx`.

> 📌 Commit: `refactor(hooks): migrate useCategories to TanStack Query`

### **Step 5 — Rewrite `useOrders`** (Sonnet)
File: `src/hooks/useOrders.ts`

Expose:
- `useOrders()` — returns `data: Order[]` with nested `order_items` + `products`
- `useUpdateOrderStatus()` — mutation that takes `{ id, status }`

Use **optimistic updates** for status changes:
```ts
export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['orders'] });
      const prev = qc.getQueryData<Order[]>(['orders']);
      qc.setQueryData<Order[]>(['orders'], (old) =>
        (old || []).map((o) => (o.id === id ? { ...o, status } : o))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['orders'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};
```

> 📌 Commit: `refactor(hooks): migrate useOrders with optimistic status updates`

### **Step 6 — Create `AdminLayout`** (Sonnet)
File: `src/pages/admin/AdminLayout.tsx`

```tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, ShoppingBag, Tags, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const navItems = [
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/catalogs', label: 'Catalogs', icon: BookOpen },
];

export const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <NavLink to="/">
              <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
            </NavLink>
            <h1 className="font-display text-2xl font-semibold tracking-wider">
              {t('admin.title')}
            </h1>
          </div>

          <nav className="flex gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-3 py-2 rounded-sm text-xs uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-destructive">
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
```

### **Step 7 — Build `ProductFormDialog`** (Sonnet)
File: `src/components/admin/ProductFormDialog.tsx`

This is the most important new component. Spec:

- Props: `{ open, onOpenChange, product?: Product (edit mode if present), categories: Category[] }`
- Uses `useCreateProduct` or `useUpdateProduct` depending on mode
- Form state holds: `name_ka, name_en, name_ru, description_ka, description_en, description_ru, price, category_id, parent_category_id, stock_quantity, gender, imageFile, imagePreview`
- **3-tab UI for names + descriptions:**
  ```tsx
  <Tabs defaultValue="ka">
    <TabsList>
      <TabsTrigger value="ka">🇬🇪 Georgian</TabsTrigger>
      <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
      <TabsTrigger value="ru">🇷🇺 Russian</TabsTrigger>
    </TabsList>
    <TabsContent value="ka">
      <Label>Name (Georgian) *</Label>
      <Input value={formData.name_ka} ... required />
      <Label>Description (Georgian)</Label>
      <Textarea value={formData.description_ka} ... />
    </TabsContent>
    <TabsContent value="en">
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="sm" onClick={copyFromGeorgian('en')}>
          📋 Copy from Georgian
        </Button>
      </div>
      <Label>Name (English)</Label>
      <Input value={formData.name_en} ... />
      <Label>Description (English)</Label>
      <Textarea value={formData.description_en} ... />
    </TabsContent>
    <TabsContent value="ru">{ /* same pattern with 'ru' */ }</TabsContent>
  </Tabs>
  ```
- `copyFromGeorgian('en')` sets `formData.name_en = formData.name_ka` and `formData.description_en = formData.description_ka` (only if target is empty, OR with confirm dialog if you want to be safer — implementer's call).
- Validation: `name_ka` required, `price > 0`, image required for create (not for edit).
- Submit: calls `createProduct.mutateAsync(input)` or `updateProduct.mutateAsync({ id, patch })`. On success: `toast.success`, close dialog, reset form. TanStack invalidation refreshes the table automatically.
- Image upload still goes through `supabase.storage.from('products').upload(...)` — extract to a helper `uploadProductImage(file): Promise<string>`.

### **Step 8 — Extract supporting product dialogs/components** (Sonnet)
Create these by moving code OUT of the old `Admin.tsx`:

- `src/components/admin/ProductDeleteDialog.tsx` — single-product confirm + `useDeleteProduct`
- `src/components/admin/ProductBulkDeleteDialog.tsx` — bulk confirm + `useBulkDeleteProducts`
- `src/components/admin/ProductImportDialog.tsx` — CSV parser + bulk insert. Use `useCreateProduct` (or a dedicated `useBulkCreateProducts` if performance matters)
- `src/components/admin/ProductExportButtons.tsx` — CSV + Excel export. Takes `products: Product[]` as prop. Export columns must use `name_ka/_en/_ru` and `description_ka/_en/_ru` directly (3 columns each).
- `src/components/admin/ProductTable.tsx` — table + search + sort + pagination. Takes `{ products, onEdit, onDelete, selected, onSelectionChange }`.

### **Step 9 — Build `AdminProducts` page** (Sonnet)
File: `src/pages/admin/AdminProducts.tsx`

```tsx
import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { ProductTable } from '@/components/admin/ProductTable';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { ProductDeleteDialog } from '@/components/admin/ProductDeleteDialog';
import { ProductBulkDeleteDialog } from '@/components/admin/ProductBulkDeleteDialog';
import { ProductImportDialog } from '@/components/admin/ProductImportDialog';
import { ProductExportButtons } from '@/components/admin/ProductExportButtons';
import { Button } from '@/components/ui/button';
import { Plus, FileUp } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

export const AdminProducts = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  if (isLoading) return <p className="text-muted-foreground">Loading products...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h2 className="font-display text-xl">Products ({products.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <ProductExportButtons products={products} />
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp size={16} className="mr-1" /> Import CSV
          </Button>
          {selected.size > 0 && (
            <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              Delete {selected.size} selected
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-1" /> Add Product
          </Button>
        </div>
      </div>

      <ProductTable
        products={products}
        onEdit={setEditProduct}
        onDelete={setDeleteProduct}
        selected={selected}
        onSelectionChange={setSelected}
      />

      <ProductFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
      />

      <ProductFormDialog
        open={!!editProduct}
        onOpenChange={(o) => !o && setEditProduct(null)}
        product={editProduct ?? undefined}
        categories={categories}
      />

      <ProductDeleteDialog
        product={deleteProduct}
        onClose={() => setDeleteProduct(null)}
      />

      <ProductBulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        ids={Array.from(selected)}
        onSuccess={() => setSelected(new Set())}
      />

      <ProductImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
};

export default AdminProducts;
```

### **Step 10 — Build `AdminOrders` page** (Sonnet)
File: `src/pages/admin/AdminOrders.tsx`

Move:
- Orders table from old Admin.tsx (lines roughly 970-1170)
- `OrderRow` component (lines 47-194 of old Admin.tsx) → `src/components/admin/OrderRow.tsx`

Refactor `OrderRow` to use `useUpdateOrderStatus()` instead of receiving `updateOrderStatus` as a prop.

### **Step 11 — Build `AdminCategories` and `AdminCatalogs` pages** (Sonnet)
Files:
- `src/pages/admin/AdminCategories.tsx` — thin wrapper around existing `<CategoryManager />` (already a complete component)
- `src/pages/admin/AdminCatalogs.tsx` — thin wrapper around existing `<CatalogManagerProject />`

These pages add a heading and any layout, but don't duplicate logic.

> ⚠️ Update `CategoryManager.tsx` and `QuickAddCategory.tsx` to use the new `useCreateCategory()` / `useUpdateCategory()` / `useDeleteCategory()` mutation hooks instead of the old hook API.

### **Step 12 — Wire new routing in `App.tsx`** (Sonnet)

```tsx
// Update imports
import AdminLayout from "./pages/admin/AdminLayout";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCatalogs from "./pages/admin/AdminCatalogs";
import { Navigate } from "react-router-dom";

// Replace the single /admin route with nested routes
<Route path="/admin/login" element={<AdminLogin />} />
<Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
  <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
  <Route path="/admin/products" element={<AdminProducts />} />
  <Route path="/admin/orders" element={<AdminOrders />} />
  <Route path="/admin/categories" element={<AdminCategories />} />
  <Route path="/admin/catalogs" element={<AdminCatalogs />} />
</Route>
```

Remove old `<Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />` line.
Remove `import Admin from "./pages/Admin"`.

### **Step 13 — Delete old `Admin.tsx`** (Sonnet)
13.1. Confirm no remaining imports of `Admin` from `@/pages/Admin` (grep)
13.2. `rm src/pages/Admin.tsx`
13.3. Run `npx tsc --noEmit` — must pass
13.4. Run `npm run build` — must succeed

> 📌 Commit: `refactor: delete monolithic Admin.tsx — replaced by admin sub-routes`

### **Step 14 — Update consumers of old `useProducts` API** (Sonnet — verify)
Check that all of these have been updated to the new TanStack Query API:
- `src/pages/Index.tsx` — `{ data: products = [], isLoading }`
- `src/pages/ProductDetails.tsx` — uses `useProduct(id)` → `{ data: product, isLoading }`
- `src/components/Header.tsx` — `{ data: categories = [] }`
- `src/components/CategoryManager.tsx` — uses `useCreateCategory()`, etc.
- `src/components/QuickAddCategory.tsx` — uses `useCreateCategory()`

Run `grep -rn "products\.length\|loading\b" src/pages src/components --include="*.tsx"` and inspect each to confirm.

### **Step 15 — Type safety sweep** (Sonnet)
15.1. `grep -rn "as any" src/ --include="*.tsx" --include="*.ts"` — list every cast
15.2. Replace each with proper Supabase generated type. Use `Database['public']['Tables']['products']['Insert']` etc. from `src/types/supabase.ts`
15.3. `npx tsc --noEmit` → must pass with zero errors

> 📌 Commit: `chore: remove all 'as any' casts in favor of generated Supabase types`

### **Step 16 — Verification** (Sonnet)

**Type & build:**
- `npx tsc --noEmit` → 0 errors
- `npm run build` (or `bun run build`) → succeeds

**Advisors:**
- MCP `get_advisors security` → no new warnings introduced (Phase 1 accepted warnings still present is OK)
- MCP `get_advisors performance` → no new warnings

**Manual smoke test (in a browser):**
1. ✅ `/admin` → redirects to `/admin/products`
2. ✅ Tab navigation: Products / Orders / Categories / Catalogs all load
3. ✅ Add product with all 3 languages filled → appears in table without reload
4. ✅ "Copy from Georgian" button fills empty `name_en`, `name_ru`
5. ✅ Edit product → updates immediately
6. ✅ Delete product → row disappears
7. ✅ Bulk select + delete → all selected disappear
8. ✅ CSV export → file downloads with all 3 language columns
9. ✅ CSV import → products appear in table
10. ✅ Order status change → updates instantly (optimistic), persists on refresh
11. ✅ Customer flow: browse → add to cart → checkout → order recorded (no reload bugs)
12. ✅ `Index.tsx` shows products correctly per current UI language

---

## 🚫 Out of Scope for Phase 2

- Visual redesign (Phase 3)
- Image optimization / lazy loading (Phase 3)
- Customer accounts / order history (Phase 4)
- MFA / advanced auth (Phase 4)
- Inventory alerts / low-stock notifications (Phase 4)
- Dashboard analytics widgets (Phase 4)

---

## ✅ Definition of Done

- [ ] Step 1 migration applied: `name`/`description` dropped, `name_ka` NOT NULL
- [ ] `create_order` updated to use `name_ka` (verified by checkout test)
- [ ] `src/types/supabase.ts` regenerated and saved
- [ ] `useProducts`, `useCategories`, `useOrders` all use `useQuery`/`useMutation`
- [ ] Zero `window.location.reload()` in `src/` (grep verifies)
- [ ] `src/pages/Admin.tsx` deleted
- [ ] 4 admin sub-routes work and are accessible only when admin
- [ ] `ProductFormDialog` has 3 language tabs + "Copy from Georgian" button
- [ ] Zero `as any` in `src/` (grep verifies — old occurrences in unchanged third-party files OK)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] Manual smoke test (12 items above) all pass
- [ ] Git commits per logical step, ~12-14 total commits

---

## 📝 Sonnet's Execution Notes

- **Branches:** Stay on `master`. Phase 2 is a single coherent feature.
- **Commits:** One per logical step. If a step is large (e.g., Step 8 has 5 files), commit per file or per coherent chunk — don't bundle into one giant commit.
- **Breakage during migration:** Old `Admin.tsx` will have type errors during Steps 3-11 because hooks change shape. **This is expected.** Add `// @ts-expect-error - old Admin.tsx being replaced` at the top of Admin.tsx if needed to keep `tsc` quiet, then delete the file in Step 13. Alternatively, exclude `src/pages/Admin.tsx` from tsconfig temporarily and add it back to delete in Step 13.
- **Mutation error handling:** Every mutation should `toast.error(err.message)` on failure. Don't swallow errors silently.
- **Form validation:** Show inline error messages near the affected field, not just a toast.
- **Image upload errors:** If image upload fails mid-submit, show the error and don't create the product (current behavior).
- **CSV import — language mapping:** CSV columns map to all 3 language fields. Spec the CSV column as `name_ka,name_en,name_ru,description_ka,description_en,description_ru,...` (or accept legacy `name,description` and fan out to ka with copies — implementer's call, but document which).
- **If stuck for > 2 attempts:** pause, write down what you tried, ask Opus.
- **Visual polish:** Keep current styling and components. Phase 3 is when we redesign — don't preempt it.

---

## 🔗 Phase 2 Migration Files (anticipated)

```
supabase/migrations/
└── 20260520_100000_drop_legacy_name_description.sql   (Step 1)
```

Only one migration this phase — most of the work is in TypeScript.

---

*🔚 End of Phase 2 Spec · Hand-off to Sonnet 4.6 ready*
