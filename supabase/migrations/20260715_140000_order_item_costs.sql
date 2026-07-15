-- Phase 3a of profit tracking: snapshot wholesale cost at sale time — in an
-- ADMIN-ONLY side table.
--
-- Not a column on order_items: customers read their own order_items with
-- select('*') (policy order_items_customer_select_own), so a cost column
-- there would leak wholesale costs. Same isolation pattern as product_costs.
-- Historical order_items (created before this migration) have no snapshot row;
-- analytics falls back to the product's current cost for those.

CREATE TABLE IF NOT EXISTS public.order_item_costs (
  order_item_id uuid PRIMARY KEY REFERENCES public.order_items(id) ON DELETE CASCADE,
  cost_at_time numeric NOT NULL DEFAULT 0 CHECK (cost_at_time >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_item_costs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.order_item_costs FROM anon;
GRANT SELECT ON public.order_item_costs TO authenticated;

DROP POLICY IF EXISTS order_item_costs_admin_read ON public.order_item_costs;
CREATE POLICY order_item_costs_admin_read ON public.order_item_costs
  FOR SELECT TO authenticated
  USING (is_admin());

-- create_order: identical to the previous version, plus a cost snapshot per
-- line. (SECURITY DEFINER writes bypass RLS, so the anon checkout still works
-- and the cost value never travels through or back to the client.)
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb,
  p_user_id uuid DEFAULT NULL::uuid,
  p_redeem_points integer DEFAULT 0
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order_id      uuid;
  v_order_item_id uuid;
  v_item          jsonb;
  v_product_id    uuid;
  v_quantity      int;
  v_price         numeric;
  v_cost          numeric;
  v_total         numeric := 0;
  v_stock         int;
  v_product_name  text;
  v_balance       int;
  v_redeem        int := GREATEST(COALESCE(p_redeem_points, 0), 0);
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN RAISE EXCEPTION 'Invalid customer name'; END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) < 5 THEN RAISE EXCEPTION 'Invalid customer phone'; END IF;
  IF p_customer_address IS NULL OR length(trim(p_customer_address)) < 3 THEN RAISE EXCEPTION 'Invalid customer address'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Order must contain at least one item'; END IF;
  IF jsonb_array_length(p_items) > 50 THEN RAISE EXCEPTION 'Too many items in one order'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::int;
    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 100 THEN RAISE EXCEPTION 'Invalid quantity for product %', v_product_id; END IF;
    SELECT price, stock_quantity, COALESCE(name_ka, name_en, name_ru, '')
      INTO v_price, v_stock, v_product_name
      FROM public.products WHERE id = v_product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product % not found', v_product_id; END IF;
    IF v_stock < v_quantity THEN RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %', v_product_name, v_quantity, v_stock; END IF;
    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  -- redemption (logged-in only): validate balance, cap at order total, deduct + ledger
  IF v_redeem > 0 THEN
    IF p_user_id IS NULL THEN RAISE EXCEPTION 'Must be logged in to redeem points'; END IF;
    SELECT points INTO v_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF v_balance IS NULL OR v_balance < v_redeem THEN RAISE EXCEPTION 'Insufficient points'; END IF;
    IF v_redeem > floor(v_total)::int THEN v_redeem := floor(v_total)::int; END IF;
    UPDATE public.profiles SET points = points - v_redeem WHERE id = p_user_id;
    INSERT INTO public.point_transactions (user_id, kind, points, note)
      VALUES (p_user_id, 'redeem', -v_redeem, 'ქულების გამოყენება შეკვეთაზე');
  END IF;

  INSERT INTO public.orders (customer_name, customer_phone, customer_address, total_price, status, user_id, points_redeemed)
  VALUES (trim(p_customer_name), trim(p_customer_phone), trim(p_customer_address), v_total, 'pending', p_user_id, v_redeem)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::int;
    SELECT price INTO v_price FROM public.products WHERE id = v_product_id;
    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_time)
      VALUES (v_order_id, v_product_id, v_quantity, v_price)
      RETURNING id INTO v_order_item_id;

    -- snapshot current wholesale cost (0 if not yet entered) into admin-only table
    SELECT cost_price INTO v_cost FROM public.product_costs WHERE product_id = v_product_id;
    INSERT INTO public.order_item_costs (order_item_id, cost_at_time)
      VALUES (v_order_item_id, COALESCE(v_cost, 0));

    UPDATE public.products SET stock_quantity = stock_quantity - v_quantity WHERE id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$function$;
