-- 1. Setup Brand Variables
DO $$ 
DECLARE 
    avon_id UUID;
    oriflame_id UUID;
    primary_cat_id UUID;
BEGIN
    SELECT id INTO avon_id FROM categories WHERE name_ka = 'AVON პროდუქცია' LIMIT 1;
    SELECT id INTO oriflame_id FROM categories WHERE name_ka = 'Oriflame პროდუქცია' LIMIT 1;

    -------------------------------------------------------
    -- AVON CLEANUP & CONSOLIDATION
    -------------------------------------------------------
    IF avon_id IS NOT NULL THEN
        -- Consolidate 'Cosmetics' for AVON
        -- First, ensure a primary subcategory exists with the correct slug
        INSERT INTO categories (name_ka, name_en, name_ru, slug, parent_id)
        VALUES ('კოსმეტიკა', 'Cosmetics', 'Косметика', 'avon-cosmetics', avon_id)
        ON CONFLICT (slug) DO UPDATE SET parent_id = avon_id 
        RETURNING id INTO primary_cat_id;

        -- Move products from other categories with the same name under AVON to this primary one
        UPDATE products 
        SET category_id = primary_cat_id
        WHERE category_id IN (
            SELECT id FROM categories 
            WHERE name_ka = 'კოსმეტიკა' AND parent_id = avon_id AND id != primary_cat_id
        );

        -- Delete the duplicates
        DELETE FROM categories 
        WHERE name_ka = 'კოსმეტიკა' AND parent_id = avon_id AND id != primary_cat_id;

        -- Consolidate 'Body Care' for AVON
        INSERT INTO categories (name_ka, name_en, name_ru, slug, parent_id)
        VALUES ('სხეულის მოვლა', 'Body Care', 'Уход за телом', 'avon-body-care', avon_id)
        ON CONFLICT (slug) DO UPDATE SET parent_id = avon_id 
        RETURNING id INTO primary_cat_id;

        UPDATE products 
        SET category_id = primary_cat_id
        WHERE category_id IN (
            SELECT id FROM categories 
            WHERE name_ka = 'სხეულის მოვლა' AND parent_id = avon_id AND id != primary_cat_id
        );

        DELETE FROM categories 
        WHERE name_ka = 'სხეულის მოვლა' AND parent_id = avon_id AND id != primary_cat_id;

        -- Consolidate 'Perfume' for AVON
        INSERT INTO categories (name_ka, name_en, name_ru, slug, parent_id)
        VALUES ('სუნამო', 'Perfume', 'Пარფюмерия', 'avon-perfume', avon_id)
        ON CONFLICT (slug) DO UPDATE SET parent_id = avon_id 
        RETURNING id INTO primary_cat_id;

        UPDATE products 
        SET category_id = primary_cat_id
        WHERE category_id IN (
            SELECT id FROM categories 
            WHERE name_ka = 'სუნამო' AND parent_id = avon_id AND id != primary_cat_id
        );

        DELETE FROM categories 
            WHERE name_ka = 'სუნამო' AND parent_id = avon_id AND id != primary_cat_id;
    END IF;

    -------------------------------------------------------
    -- ORIFLAME CLEANUP & CONSOLIDATION
    -------------------------------------------------------
    IF oriflame_id IS NOT NULL THEN
        -- Consolidate 'Cosmetics' for Oriflame
        INSERT INTO categories (name_ka, name_en, name_ru, slug, parent_id)
        VALUES ('კოსმეტიკა', 'Cosmetics', 'Косметика', 'oriflame-cosmetics', oriflame_id)
        ON CONFLICT (slug) DO UPDATE SET parent_id = oriflame_id 
        RETURNING id INTO primary_cat_id;

        UPDATE products 
        SET category_id = primary_cat_id
        WHERE category_id IN (
            SELECT id FROM categories 
            WHERE name_ka = 'კოსმეტიკა' AND parent_id = oriflame_id AND id != primary_cat_id
        );

        DELETE FROM categories 
        WHERE name_ka = 'კოსმეტიკა' AND parent_id = oriflame_id AND id != primary_cat_id;

        -- Consolidate 'Body Care' for Oriflame
        INSERT INTO categories (name_ka, name_en, name_ru, slug, parent_id)
        VALUES ('სხეულის მოვლა', 'Body Care', 'Уход за телом', 'oriflame-body-care', oriflame_id)
        ON CONFLICT (slug) DO UPDATE SET parent_id = oriflame_id 
        RETURNING id INTO primary_cat_id;

        UPDATE products 
        SET category_id = primary_cat_id
        WHERE category_id IN (
            SELECT id FROM categories 
            WHERE name_ka = 'სხეულის მოვლა' AND parent_id = oriflame_id AND id != primary_cat_id
        );

        DELETE FROM categories 
        WHERE name_ka = 'სხეულის მოვლა' AND parent_id = oriflame_id AND id != primary_cat_id;

        -- Consolidate 'Perfume' for Oriflame
        INSERT INTO categories (name_ka, name_en, name_ru, slug, parent_id)
        VALUES ('სუნამო', 'Perfume', 'Пარფюмерия', 'oriflame-perfume', oriflame_id)
        ON CONFLICT (slug) DO UPDATE SET parent_id = oriflame_id 
        RETURNING id INTO primary_cat_id;

        UPDATE products 
        SET category_id = primary_cat_id
        WHERE category_id IN (
            SELECT id FROM categories 
            WHERE name_ka = 'სუნამო' AND parent_id = oriflame_id AND id != primary_cat_id
        );

        DELETE FROM categories 
        WHERE name_ka = 'სუნამო' AND parent_id = oriflame_id AND id != primary_cat_id;
    END IF;

    -------------------------------------------------------
    -- FINAL GLOBAL CLEANUP
    -------------------------------------------------------
    -- Remove any gender-related categories
    DELETE FROM categories 
    WHERE name_ka IN ('მამაკაცებისთვის', 'უნისექსი', 'ქალბატონებისთვის')
       OR name_en IN ('Men', 'Unisex', 'Women', 'Woman', 'Man');

    -- Remove any top-level categories that should only be subcategories
    -- (Items that have no parent but have these specific names)
    DELETE FROM categories 
    WHERE parent_id IS NULL AND name_ka IN ('კოსმეტიკა', 'სხეულის მოვლა', 'სუნამო');

END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
