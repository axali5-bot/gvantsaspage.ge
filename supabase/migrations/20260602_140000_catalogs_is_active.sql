ALTER TABLE public.catalogs ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.catalogs.is_active IS 'Admin toggle — false hides catalog from customers without deleting it';
