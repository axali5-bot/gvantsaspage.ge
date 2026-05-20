-- Fix 1: Revoke handle_new_user from anon/authenticated (trigger-only, not for REST)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Fix 2: Split FOR ALL admin policies into INSERT/UPDATE/DELETE to eliminate
-- multiple_permissive_policies overlap with public_read SELECT policies

-- products
DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE TO authenticated USING (public.is_admin());

-- categories
DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_insert" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_update" ON public.categories
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_delete" ON public.categories
  FOR DELETE TO authenticated USING (public.is_admin());

-- catalogs
DROP POLICY IF EXISTS "catalogs_admin_write" ON public.catalogs;
CREATE POLICY "catalogs_admin_insert" ON public.catalogs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "catalogs_admin_update" ON public.catalogs
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "catalogs_admin_delete" ON public.catalogs
  FOR DELETE TO authenticated USING (public.is_admin());

-- catalog_pages
DROP POLICY IF EXISTS "catalog_pages_admin_write" ON public.catalog_pages;
CREATE POLICY "catalog_pages_admin_insert" ON public.catalog_pages
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "catalog_pages_admin_update" ON public.catalog_pages
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "catalog_pages_admin_delete" ON public.catalog_pages
  FOR DELETE TO authenticated USING (public.is_admin());

-- Fix 3: profiles — replace admin_all (ALL) with specific INSERT/DELETE,
-- merge update into one policy covering both own and admin
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin());
