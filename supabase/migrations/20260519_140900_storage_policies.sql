-- Drop all old over-permissive storage policies
DROP POLICY IF EXISTS "Public manage storage" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Select" ON storage.objects;
DROP POLICY IF EXISTS "Public View 1ifhysk_0" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload 1ifhysk_0" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload 1ifhysk_1" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload 1ifhysk_2" ON storage.objects;

-- Public read for object URLs (does NOT enable listing)
CREATE POLICY "objects_public_read_products" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'products');

CREATE POLICY "objects_public_read_catalogs" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'catalogs');

-- Admin-only writes
CREATE POLICY "objects_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('products', 'catalogs') AND public.is_admin()
  );

CREATE POLICY "objects_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('products', 'catalogs') AND public.is_admin())
  WITH CHECK (bucket_id IN ('products', 'catalogs') AND public.is_admin());

CREATE POLICY "objects_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('products', 'catalogs') AND public.is_admin());
