-- Phase 1 of profit tracking: admin-only "current cost" table.
--
-- Kept separate from public.products because products is world-readable
-- (policy products_public_read: qual = true for anon) and the storefront
-- fetches it with select('*'). Wholesale cost must never leak to the public
-- API, so it lives in its own table behind is_admin() RLS.

CREATE TABLE IF NOT EXISTS public.product_costs (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  cost_price numeric NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;

-- Defense in depth: the public/anon role gets no access at all.
REVOKE ALL ON public.product_costs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_costs TO authenticated;

-- Only admins (profiles.is_admin) can read or write cost data.
DROP POLICY IF EXISTS product_costs_admin_all ON public.product_costs;
CREATE POLICY product_costs_admin_all ON public.product_costs
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
