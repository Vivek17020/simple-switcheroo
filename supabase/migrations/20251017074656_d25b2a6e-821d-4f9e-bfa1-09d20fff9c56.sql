-- Update Gadgets category slug for cleaner URLs
-- Since Gadgets is already a subcategory of Technology, we can use just 'gadgets' as the slug
UPDATE categories 
SET slug = 'gadgets' 
WHERE name = 'Gadgets' 
  AND parent_id = (SELECT id FROM categories WHERE slug = 'technology' LIMIT 1);

-- Verify the update
SELECT id, name, slug, parent_id 
FROM categories 
WHERE slug IN ('technology', 'gadgets') 
ORDER BY parent_id NULLS FIRST, name;