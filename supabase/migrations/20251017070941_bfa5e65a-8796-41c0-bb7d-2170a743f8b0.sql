-- Add parent_id column to support subcategories
ALTER TABLE public.categories 
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Insert Technology main category
INSERT INTO public.categories (name, slug, description, color, parent_id)
VALUES 
  ('Technology', 'technology', 'News and insights on emerging technologies', '#3B82F6', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Insert Technology subcategories
INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'AI', 'technology-ai', 'Artificial intelligence and machine learning news', '#3B82F6', id
FROM public.categories WHERE slug = 'technology'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'Gadgets', 'technology-gadgets', 'Latest gadget reviews and releases', '#3B82F6', id
FROM public.categories WHERE slug = 'technology'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'Apps', 'technology-apps', 'Mobile and web application news', '#3B82F6', id
FROM public.categories WHERE slug = 'technology'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'Cybersecurity', 'technology-cybersecurity', 'Security threats and protection news', '#3B82F6', id
FROM public.categories WHERE slug = 'technology'
ON CONFLICT (slug) DO NOTHING;