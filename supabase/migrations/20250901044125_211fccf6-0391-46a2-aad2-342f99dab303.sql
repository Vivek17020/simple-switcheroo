-- Drop the security definer view and replace with a function approach
DROP VIEW IF EXISTS public.author_profiles;

-- Create a function to safely get author profiles for published articles
CREATE OR REPLACE FUNCTION public.get_author_profile(author_uuid uuid)
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  author_image_url text,
  author_bio text,
  job_title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.author_image_url,
    p.author_bio,
    p.job_title
  FROM public.profiles p
  WHERE p.id = author_uuid
  AND EXISTS (
    SELECT 1 
    FROM public.articles a 
    WHERE a.author_id = p.id 
    AND a.published = true
  );
$$;