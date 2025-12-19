-- First, create "Previous Year Papers" subcategory under Jobs
INSERT INTO categories (name, slug, description, color, parent_id)
VALUES ('Previous Year Papers', 'previous-year-papers', 'Download previous year question papers for competitive exams', 'jobs', 'b43bf6a6-c2de-4151-8939-cf83cc5cee03'::uuid)
ON CONFLICT (slug) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Migrate articles from "Jobs/Previous Year Papers" to new "Previous Year Papers" subcategory
UPDATE articles SET category_id = (
  SELECT id FROM categories WHERE slug = 'previous-year-papers' AND parent_id = 'b43bf6a6-c2de-4151-8939-cf83cc5cee03'::uuid
)
WHERE category_id = '14a2b2c8-64a1-4aee-ae4f-2d42310c407e'::uuid;

-- Migrate articles from "Jobs/Admit Cards" to new "Admit Cards" subcategory  
UPDATE articles SET category_id = '4673a401-c1ab-40d3-9e18-9dee890f1847'::uuid
WHERE category_id = 'c45f7dce-57d3-446d-972e-efc472f0f273'::uuid;

-- Migrate articles from "Jobs/Results" to new "Results" subcategory
UPDATE articles SET category_id = '3cc83307-bd74-4831-8902-e323204cb369'::uuid  
WHERE category_id = '04c4532c-3bb7-4b5f-8e03-983af2bbf91f'::uuid;

-- Migrate articles from "Jobs/Syllabus" to "Exam Updates" subcategory
UPDATE articles SET category_id = '488a5d71-cbaf-4b0c-997c-f3170581aaca'::uuid
WHERE category_id = '95f28731-9703-48d5-980f-992960cc9556'::uuid;

-- Finally delete the old flat categories
DELETE FROM categories WHERE id IN (
  '14a2b2c8-64a1-4aee-ae4f-2d42310c407e',
  'c45f7dce-57d3-446d-972e-efc472f0f273', 
  '04c4532c-3bb7-4b5f-8e03-983af2bbf91f',
  '95f28731-9703-48d5-980f-992960cc9556'
);