-- Add parent_id to categories to support subcategories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Ensure all name fields are not null for consistency
ALTER TABLE categories ALTER COLUMN name_ka SET NOT NULL;
ALTER TABLE categories ALTER COLUMN name_en SET NOT NULL;
ALTER TABLE categories ALTER COLUMN name_ru SET NOT NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
