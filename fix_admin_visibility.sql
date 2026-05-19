-- ეს სკრიპტი რთავს "Read" (წაკითხვის) უფლებას შეკვეთებზე
-- რადგან Admin პანელი არ იყენებს Supabase Auth-ს, გვჭირდება საჯარო წვდომა ანონიმური მომხმარებლისთვის

-- 1. Orders ცხრილზე წაკითხვის უფლება
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ჯერ წავშალოთ თუ არსებობს, რომ არ მოხდეს დუბლირების შეცდომა
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;

CREATE POLICY "Enable read access for all users" ON orders
FOR SELECT
USING (true);

-- 2. Order Items ცხრილზე წაკითხვის უფლება
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;

CREATE POLICY "Enable read access for all users" ON order_items
FOR SELECT
USING (true);
