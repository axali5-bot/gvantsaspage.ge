-- Phase A: orders that come back FROM samkaulebi.shop when a partner-pushed
-- product is sold there. The webhook Edge Function inserts here (service_role);
-- the admin sees them live via Supabase Realtime in a dedicated tab.

CREATE TABLE IF NOT EXISTS public.incoming_orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  samkaulebi_order_id  text UNIQUE,          -- idempotency: one remote order = one row
  items                jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{samkaulebi_product_id, avon_product_id, name, quantity, unit_price}]
  total_price          numeric NOT NULL DEFAULT 0,
  customer_name        text,
  customer_phone       text,
  customer_address     text,
  status               text NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new', 'seen', 'fulfilled', 'cancelled')),
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.incoming_orders ENABLE ROW LEVEL SECURITY;

-- Admin reads the list and updates status (new → seen → fulfilled).
-- INSERT happens only via the Edge Function (service_role bypasses RLS) — no insert policy.
DROP POLICY IF EXISTS "incoming_orders_admin_read" ON public.incoming_orders;
CREATE POLICY "incoming_orders_admin_read" ON public.incoming_orders
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "incoming_orders_admin_update" ON public.incoming_orders;
CREATE POLICY "incoming_orders_admin_update" ON public.incoming_orders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Fast unread-badge count
CREATE INDEX IF NOT EXISTS idx_incoming_orders_new
  ON public.incoming_orders(created_at DESC) WHERE status = 'new';

-- Enable Realtime so the admin tab updates live on INSERT
ALTER PUBLICATION supabase_realtime ADD TABLE public.incoming_orders;
