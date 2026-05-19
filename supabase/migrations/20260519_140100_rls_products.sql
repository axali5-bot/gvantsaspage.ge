DROP POLICY IF EXISTS "Public manage products" ON public.products;
DROP POLICY IF EXISTS "Auth manage products" ON public.products;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;

CREATE POLICY "products_public_read" ON public.products
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
