-- Draft/hidden products: quick-created from a purchase order before they have
-- photos/descriptions. Hidden at RLS level, so the storefront, the AI chatbot
-- (anon key) and any other public reader never see them; admins see everything.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS products_public_read ON public.products;
CREATE POLICY products_public_read ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_published OR is_admin());
