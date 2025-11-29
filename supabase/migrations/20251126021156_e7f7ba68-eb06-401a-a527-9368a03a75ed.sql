-- Add slug column to web3_code_snippets table
ALTER TABLE public.web3_code_snippets 
ADD COLUMN slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX web3_code_snippets_slug_key ON public.web3_code_snippets(slug);

-- Update existing rows to generate slugs from titles
UPDATE public.web3_code_snippets
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing rows
ALTER TABLE public.web3_code_snippets 
ALTER COLUMN slug SET NOT NULL;

COMMENT ON COLUMN public.web3_code_snippets.slug IS 'URL-friendly slug for the code snippet';