-- Add missing categories
INSERT INTO categories (name, slug, description, color) VALUES
  ('Politics', 'politics', 'Political news and government updates', 'politics'),
  ('Education', 'education', 'Educational news and academic insights', 'education'),
  ('World', 'world', 'International news and global events', 'world'),
  ('Sports', 'sports', 'Sports news and athletics coverage', 'sports')
ON CONFLICT (slug) DO NOTHING;