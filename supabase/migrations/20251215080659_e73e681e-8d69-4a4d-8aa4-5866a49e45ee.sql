-- Fix Security Definer Views
-- Recreate views with SECURITY INVOKER to use querying user's permissions

-- Drop and recreate vapid_public_keys view with SECURITY INVOKER
DROP VIEW IF EXISTS public.vapid_public_keys;
CREATE VIEW public.vapid_public_keys 
WITH (security_invoker = true)
AS
SELECT id, public_key, created_at FROM public.vapid_config;

-- Grant select on the view to authenticated and anon users
GRANT SELECT ON public.vapid_public_keys TO authenticated, anon;

-- Check and fix public_profiles view if it exists with security definer
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  author_image_url,
  author_bio,
  job_title,
  created_at,
  updated_at
FROM public.profiles
WHERE EXISTS (
  SELECT 1 FROM public.articles
  WHERE articles.author_id = profiles.id
  AND articles.published = true
);

-- Grant select on public_profiles to all
GRANT SELECT ON public.public_profiles TO authenticated, anon;