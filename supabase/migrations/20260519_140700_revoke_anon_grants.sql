-- Remove dangerous privileges anon should never have
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public FROM anon;

-- Re-grant only what's needed
GRANT SELECT ON public.products, public.categories, public.catalogs, public.catalog_pages TO anon;

-- Verify no DML grants remain for anon
DO $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'anon still has DML grants on % rows', v_count;
  END IF;
END $$;
