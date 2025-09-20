-- Drop the existing public_profiles view that has SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view without SECURITY DEFINER (uses SECURITY INVOKER by default)
-- This ensures the view respects the querying user's permissions and RLS policies
CREATE VIEW public.public_profiles AS
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

-- Grant appropriate permissions to the view
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;