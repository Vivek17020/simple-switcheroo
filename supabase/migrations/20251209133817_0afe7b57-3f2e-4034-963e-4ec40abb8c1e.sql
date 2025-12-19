-- Add missing economy category for UPSC Briefs
INSERT INTO categories (name, slug, description, color, parent_id)
SELECT 
  'Economy',
  'economy',
  'Indian Economy topics for UPSC preparation including GDP, inflation, banking, fiscal policy, and economic reforms',
  '#10B981',
  id
FROM categories 
WHERE slug = 'upsc'
ON CONFLICT (slug) DO NOTHING;