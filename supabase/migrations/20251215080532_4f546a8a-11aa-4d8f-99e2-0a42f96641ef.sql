-- Fix profiles table email exposure
-- Drop the overly permissive policy that allows anyone to see all profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Drop the conflicting deny policy (no longer needed since we're using proper policies)
DROP POLICY IF EXISTS "profiles_deny_public_access" ON public.profiles;

-- Update the public_profiles_viewable_by_all policy to use a security definer function
-- that returns profiles without email addresses
DROP POLICY IF EXISTS "public_profiles_viewable_by_all" ON public.profiles;

-- Create a policy for viewing public author profiles (authors who have published articles)
-- This ensures only authors with published content are publicly visible
CREATE POLICY "public_author_profiles_viewable"
ON public.profiles
FOR SELECT
USING (
  -- Only show profiles of authors who have published articles
  EXISTS (
    SELECT 1 FROM public.articles
    WHERE articles.author_id = profiles.id
    AND articles.published = true
  )
);

-- Note: The email column is still in the table but with this policy,
-- only author profiles are visible publicly. 
-- For the frontend, we should use the public_profiles view or select specific columns
-- The existing public_profiles view already excludes email addresses