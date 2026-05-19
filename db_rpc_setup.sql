-- 1. სვეტების დამატება და გასწორება (თუ არ არსებობს)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address text;

-- თუ customer_email სავალდებულოა, გავხადოთ არასავალდებულო, რადგან Checkout-ში არ გვაქვს
ALTER TABLE orders ALTER COLUMN customer_email DROP NOT NULL;

-- 2. ფუნქციის განახლება სწორი სვეტებით (total_price-ის გამოყენება)
CREATE OR REPLACE FUNCTION create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_total_amount numeric,
  p_items json
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_item json;
BEGIN
  -- 1. შეკვეთის შექმნა (ვიყენებთ total_price-ს და არა total_amount-ს)
  INSERT INTO orders (customer_name, customer_phone, customer_address, total_price, status)
  VALUES (p_customer_name, p_customer_phone, p_customer_address, p_total_amount, 'pending')
  RETURNING id INTO v_order_id;

  -- 2. შეკვეთის ნივთების დამატება
  FOR v_item IN SELECT * FROM json_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'price_at_time')::numeric
    );
  END LOOP;

  RETURN v_order_id::text;
END;
$$;

-- Schema Cache-ის განახლება
NOTIFY pgrst, 'reload schema';
