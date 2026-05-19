DROP POLICY IF EXISTS "Auth manage items" ON public.order_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_items;

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
