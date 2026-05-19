-- ეს სკრიპტი რთავს "Update" (რედაქტირების) უფლებას შეკვეთებზე
-- ეს აუცილებელია რომ ადმინმა შეძლოს სტატუსის შეცვლა (Pending -> Completed)

-- ჯერ წავშალოთ თუ არსებობს ძველი პოლიტიკა
DROP POLICY IF EXISTS "Enable update access for all users" ON orders;

-- შევქმნათ ახალი პოლიტიკა განახლებისთვის
CREATE POLICY "Enable update access for all users" ON orders
FOR UPDATE
USING (true)
WITH CHECK (true);
