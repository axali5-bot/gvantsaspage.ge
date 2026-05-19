DROP POLICY IF EXISTS "Public manage catalog_pages" ON public.catalog_pages;
DROP POLICY IF EXISTS "Public read catalog_pages" ON public.catalog_pages;

CREATE POLICY "catalog_pages_public_read" ON public.catalog_pages
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "catalog_pages_admin_write" ON public.catalog_pages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
