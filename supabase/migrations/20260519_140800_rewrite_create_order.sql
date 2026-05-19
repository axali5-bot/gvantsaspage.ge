-- Drop the old version (old signature had 5 params including total_amount)
DROP FUNCTION IF EXISTS public.create_order(text, text, text, numeric, json);
DROP FUNCTION IF EXISTS public.create_order(text, text, text, numeric, jsonb);
DROP FUNCTION IF EXISTS public.create_order(text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_price numeric;
  v_total numeric := 0;
  v_stock int;
  v_product_name text;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid customer name';
  END IF;

  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) < 5 THEN
    RAISE EXCEPTION 'Invalid customer phone';
  END IF;

  IF p_customer_address IS NULL OR length(trim(p_customer_address)) < 3 THEN
    RAISE EXCEPTION 'Invalid customer address';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Too many items in one order';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    SELECT price, stock_quantity, name
      INTO v_price, v_stock, v_product_name
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %',
        v_product_name, v_quantity, v_stock;
    END IF;

    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  INSERT INTO public.orders (
    customer_name, customer_phone, customer_address, total_price, status
  ) VALUES (
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_customer_address),
    v_total,
    'pending'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;

    SELECT price INTO v_price FROM public.products WHERE id = v_product_id;

    INSERT INTO public.order_items (order_id, product_id, quantity, price_at_time)
    VALUES (v_order_id, v_product_id, v_quantity, v_price);

    UPDATE public.products
    SET stock_quantity = stock_quantity - v_quantity
    WHERE id = v_product_id;
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, jsonb) TO anon, authenticated;
