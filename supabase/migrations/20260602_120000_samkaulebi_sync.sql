-- Partner integration: AVON2FLAME → samkaulebi.shop
-- Maps each local product to its remote samkaulebi.shop product, so edits/deletes
-- can be synced and the admin UI can show per-product sync state.

-- 1. products.updated_at — lets the bulk "reconcile" step detect products that
--    changed locally after their last sync (updated_at > last_synced_at).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_touch_updated_at ON public.products;
CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. samkaulebi_sync — local product ↔ remote samkaulebi product mapping.
CREATE TABLE IF NOT EXISTS public.samkaulebi_sync (
  avon_product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  samkaulebi_id   text NOT NULL,
  status          text NOT NULL DEFAULT 'synced'
                    CHECK (status IN ('synced', 'dirty', 'error')),
  last_synced_at  timestamptz NOT NULL DEFAULT now(),
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.samkaulebi_sync ENABLE ROW LEVEL SECURITY;

-- Admin reads the table to render sync badges in the product list.
-- All writes go through the Edge Function using the service_role key, which
-- bypasses RLS — so no INSERT/UPDATE/DELETE policy is defined here (intentional).
DROP POLICY IF EXISTS "samkaulebi_sync_admin_read" ON public.samkaulebi_sync;
CREATE POLICY "samkaulebi_sync_admin_read" ON public.samkaulebi_sync
  FOR SELECT TO authenticated
  USING (public.is_admin());
