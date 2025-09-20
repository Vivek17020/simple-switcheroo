-- Check if the issue is related to functions that return tables
-- Let's ensure the public_profiles view is completely recreated without any potential issues

-- Drop and recreate the public_profiles view with explicit security settings
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Create a simple view without any security definer properties
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

-- Ensure proper permissions without security definer
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Check if any of our security definer functions might be causing the issue
-- Let's verify they are properly defined as functions, not views
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND security_type = 'DEFINER'
AND routine_name IN ('get_public_comments', 'get_user_subscription_status', 'get_safe_author_profile');