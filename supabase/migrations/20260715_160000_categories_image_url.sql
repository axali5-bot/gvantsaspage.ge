-- Category photo for homepage tiles / admin. Public content (categories table
-- is world-readable by design), stored in the existing public products bucket.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;
