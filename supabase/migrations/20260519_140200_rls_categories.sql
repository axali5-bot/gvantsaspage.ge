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
