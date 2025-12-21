-- Create parent category "upscbriefs"
INSERT INTO categories (name, slug, description, color)
VALUES ('UPSCBriefs', 'upscbriefs', 'UPSC Preparation - IAS, IPS, UPSC Notes, Current Affairs', '#1E3A8A')
ON CONFLICT (slug) DO NOTHING;

-- Create 9 subject subcategories under upscbriefs
INSERT INTO categories (name, slug, description, parent_id, color) VALUES
('Polity', 'polity', 'Indian Polity & Governance - Constitution, Parliament, Judiciary', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#2563EB'),
('Economy', 'economy', 'Indian Economy - Budget, Banking, Economic Policies', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#059669'),
('Geography', 'geography', 'Indian & World Geography - Physical, Human, Economic Geography', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#D97706'),
('History', 'history', 'Ancient, Medieval & Modern Indian History', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#DC2626'),
('Environment', 'environment', 'Environment & Ecology - Climate Change, Biodiversity', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#16A34A'),
('Science & Tech', 'science-tech', 'Science & Technology - Space, IT, Biotechnology', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#7C3AED'),
('Art & Culture', 'art-culture', 'Indian Art & Culture - Heritage, Traditions, Dance, Music', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#DB2777'),
('International Relations', 'international-relations', 'International Relations - Foreign Policy, Organizations', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#0891B2'),
('Society', 'society', 'Indian Society - Social Issues, Welfare Schemes', (SELECT id FROM categories WHERE slug = 'upscbriefs'), '#EA580C')
ON CONFLICT (slug) DO NOTHING;