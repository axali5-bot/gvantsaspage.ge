DROP POLICY IF EXISTS "Public Manage" ON public.catalogs;
DROP POLICY IF EXISTS "Public Select" ON public.catalogs;

CREATE POLICY "catalogs_public_read" ON public.catalogs
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "catalogs_admin_write" ON public.catalogs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
