-- Phase 2 of profit tracking: procurement / bulk-order ledger (admin-only).
-- Records every wholesale order to Avon/Oriflame: what, how much, what it cost.

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier text NOT NULL,                         -- 'Avon' | 'Oriflame' | free text
  campaign text,                                  -- catalog/campaign reference
  ordered_at date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'received',        -- 'received' (applied) | 'ordered'
  note text,
  total_cost numeric NOT NULL DEFAULT 0,          -- denormalized sum of line items (₾)
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric NOT NULL CHECK (unit_cost >= 0),
  line_total numeric NOT NULL DEFAULT 0,          -- quantity * unit_cost
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product ON public.purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_po_ordered_at ON public.purchase_orders(ordered_at DESC);

-- ---- RLS: admin only, both tables ----
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.purchase_orders FROM anon;
REVOKE ALL ON public.purchase_order_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;

DROP POLICY IF EXISTS purchase_orders_admin_all ON public.purchase_orders;
CREATE POLICY purchase_orders_admin_all ON public.purchase_orders
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS purchase_order_items_admin_all ON public.purchase_order_items;
CREATE POLICY purchase_order_items_admin_all ON public.purchase_order_items
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---- Atomic "log a bulk purchase" RPC ----
-- One transaction: writes the ledger, restocks products, and sets each
-- product's current cost to this batch's unit_cost. Admin-gated inside.
CREATE OR REPLACE FUNCTION public.create_purchase_order(
  p_supplier   text,
  p_campaign   text,
  p_ordered_at date,
  p_note       text,
  p_items      jsonb   -- [{ "product_id": uuid, "quantity": int, "unit_cost": numeric }, ...]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po_id      uuid;
  v_item       jsonb;
  v_total      numeric := 0;
  v_line_total numeric;
  v_pid        uuid;
  v_qty        integer;
  v_cost       numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'purchase must have at least one item';
  END IF;

  INSERT INTO purchase_orders (supplier, campaign, ordered_at, note, status, total_cost, created_by)
  VALUES (
    NULLIF(btrim(p_supplier), ''),
    NULLIF(btrim(p_campaign), ''),
    COALESCE(p_ordered_at, current_date),
    NULLIF(btrim(p_note), ''),
    'received',
    0,
    auth.uid()
  )
  RETURNING id INTO v_po_id;

  IF (SELECT supplier FROM purchase_orders WHERE id = v_po_id) IS NULL THEN
    RAISE EXCEPTION 'supplier is required';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid  := (v_item->>'product_id')::uuid;
    v_qty  := (v_item->>'quantity')::int;
    v_cost := (v_item->>'unit_cost')::numeric;

    IF v_pid IS NULL OR v_qty IS NULL OR v_qty <= 0 OR v_cost IS NULL OR v_cost < 0 THEN
      RAISE EXCEPTION 'invalid line item: %', v_item;
    END IF;

    v_line_total := v_qty * v_cost;
    v_total := v_total + v_line_total;

    INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, line_total)
    VALUES (v_po_id, v_pid, v_qty, v_cost, v_line_total);

    -- restock (updated_at bump also flags the product for samkaulebi re-sync)
    UPDATE products
       SET stock_quantity = COALESCE(stock_quantity, 0) + v_qty,
           updated_at = now()
     WHERE id = v_pid;

    -- latest purchase cost becomes the product's current cost
    INSERT INTO product_costs (product_id, cost_price, updated_at)
    VALUES (v_pid, v_cost, now())
    ON CONFLICT (product_id) DO UPDATE
      SET cost_price = EXCLUDED.cost_price, updated_at = now();
  END LOOP;

  UPDATE purchase_orders SET total_cost = v_total WHERE id = v_po_id;
  RETURN v_po_id;
END;
$$;

-- Admin-only: keep it off the anon API surface entirely (is_admin() also guards inside).
REVOKE ALL ON FUNCTION public.create_purchase_order(text, text, date, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_purchase_order(text, text, date, text, jsonb) TO authenticated;
