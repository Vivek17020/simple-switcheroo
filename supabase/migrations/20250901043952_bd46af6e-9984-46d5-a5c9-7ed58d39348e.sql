-- Drop the existing overly permissive policy
DROP POLICY "Public profiles are viewable by everyone" ON public.profiles;

-- Create more secure policies for profile access

-- Allow users to view their own complete profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Allow limited public access to author information for published articles only
-- This allows displaying author bio, name, and image for published content
CREATE POLICY "Public can view author info for published articles" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT DISTINCT author_id 
    FROM public.articles 
    WHERE published = true 
    AND author_id IS NOT NULL
  )
);

-- Create a view for safe public author information (excludes sensitive fields)
CREATE OR REPLACE VIEW public.author_profiles AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  author_image_url,
  author_bio,
  job_title
FROM public.profiles
WHERE id IN (
  SELECT DISTINCT author_id 
  FROM public.articles 
  WHERE published = true 
  AND author_id IS NOT NULL
);

-- Grant public access to the safe author view
GRANT SELECT ON public.author_profiles TO anon, authenticated;