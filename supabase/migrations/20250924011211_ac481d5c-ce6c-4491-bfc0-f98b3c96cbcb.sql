-- Drop and recreate the public_profiles view with explicit SECURITY INVOKER
-- This ensures the view uses the permissions of the querying user, not the view creator

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
WHERE id IN (
  SELECT DISTINCT articles.author_id
  FROM public.articles
  WHERE articles.published = true 
  AND articles.author_id IS NOT NULL
);