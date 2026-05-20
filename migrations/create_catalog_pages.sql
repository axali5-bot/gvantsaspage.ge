-- Create catalog_pages table for flipbook images
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS catalog_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT NOT NULL CHECK (brand IN ('avon', 'oriflame')),
  page_number INTEGER NOT NULL CHECK (page_number > 0),
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_brand_page UNIQUE(brand, page_number)
);

-- Create index for faster brand queries
CREATE INDEX IF NOT EXISTS idx_catalog_pages_brand ON catalog_pages(brand);

-- Create index for ordering pages
CREATE INDEX IF NOT EXISTS idx_catalog_pages_brand_page ON catalog_pages(brand, page_number);

-- Enable Row Level Security
ALTER TABLE catalog_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read catalog pages
CREATE POLICY "Anyone can view catalog pages"
  ON catalog_pages
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert (for admin)
CREATE POLICY "Authenticated users can insert catalog pages"
  ON catalog_pages
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only authenticated users can update (for admin)
CREATE POLICY "Authenticated users can update catalog pages"
  ON catalog_pages
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Only authenticated users can delete (for admin)
CREATE POLICY "Authenticated users can delete catalog pages"
  ON catalog_pages
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_catalog_pages_updated_at
    BEFORE UPDATE ON catalog_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
