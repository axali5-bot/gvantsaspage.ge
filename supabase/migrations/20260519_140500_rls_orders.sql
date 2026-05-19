DROP POLICY IF EXISTS "Auth manage orders" ON public.orders;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.orders;

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
