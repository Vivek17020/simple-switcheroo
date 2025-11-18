-- Drop existing public_profiles if it exists and recreate it properly
DROP VIEW IF EXISTS public.public_profiles;

-- Create a secure public view of profiles with only author-related information
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
WHERE EXISTS (
  SELECT 1 FROM public.articles 
  WHERE articles.author_id = profiles.id 
  AND articles.published = true
);

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = false);

-- Grant SELECT permission to anonymous and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Create RLS policy to allow public read access
CREATE POLICY "public_profiles_viewable_by_all"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.articles 
    WHERE articles.author_id = profiles.id 
    AND articles.published = true
  )
);