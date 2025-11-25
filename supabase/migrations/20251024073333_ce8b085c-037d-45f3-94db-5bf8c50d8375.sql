-- Replace Science category with Defence category
UPDATE categories 
SET 
  name = 'Defence',
  slug = 'defence',
  description = 'Defence news, exam preparation, current affairs, and motivation stories'
WHERE slug = 'science';

-- If Science category doesn't exist, insert Defence category
INSERT INTO categories (name, slug, description)
SELECT 'Defence', 'defence', 'Defence news, exam preparation, current affairs, and motivation stories'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'defence');

-- Insert Defence subcategories
DO $$
DECLARE
  defence_cat_id uuid;
BEGIN
  -- Get Defence category ID
  SELECT id INTO defence_cat_id FROM categories WHERE slug = 'defence';
  
  -- Delete existing subcategories under Defence if any
  DELETE FROM categories WHERE parent_id = defence_cat_id;
  
  -- Insert Defence subcategories
  INSERT INTO categories (name, slug, description, parent_id) VALUES
    ('Defence News', 'defence-news', 'Latest news from defence sector', defence_cat_id),
    ('SSB & Exam Prep', 'ssb-exam-prep', 'SSB interviews and defence exam preparation', defence_cat_id),
    ('Current Affairs Weekly', 'current-affairs-weekly', 'Weekly current affairs for defence aspirants', defence_cat_id),
    ('Motivation Stories', 'motivation-stories', 'Inspiring stories from the defence community', defence_cat_id),
    ('Defence Technology', 'defence-technology', 'Latest in defence technology and innovations', defence_cat_id);
END $$;