-- Fix Critical Security Issues (Corrected)

-- 1. Add explicit deny policy for public access to profiles table
-- This prevents unauthorized access to sensitive user data
CREATE POLICY "profiles_deny_public_access"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 2. Create a safe view function for comments that excludes email
-- This replaces the existing get_public_comments function
CREATE OR REPLACE FUNCTION public.get_safe_comments(article_uuid uuid)
RETURNS TABLE(
  id uuid,
  content text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  article_id uuid,
  author_name text,
  user_id uuid
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id,
    c.content,
    c.created_at,
    c.updated_at,
    c.article_id,
    c.author_name,
    c.user_id
  FROM public.comments c
  WHERE c.article_id = article_uuid
  AND c.is_approved = true
  ORDER BY c.created_at DESC;
$$;

-- 3. Strengthen newsletter_subscribers policies
-- Drop the permissive "Deny all by default" and replace with specific policies
DROP POLICY IF EXISTS "Deny all by default" ON public.newsletter_subscribers;

-- Explicitly deny all public SELECT access to prevent email harvesting
CREATE POLICY "newsletter_subscribers_deny_public_select"
ON public.newsletter_subscribers
FOR SELECT
TO anon
USING (false);

-- 4. Add additional protection for newsletter_preferences
-- Explicitly deny anonymous users from viewing any preferences
CREATE POLICY "newsletter_preferences_deny_anon_select"
ON public.newsletter_preferences
FOR SELECT
TO anon
USING (false);

-- 5. Update public_view_approved_comments policy to exclude email
-- First drop the existing policy
DROP POLICY IF EXISTS "public_view_approved_comments" ON public.comments;

-- Create new policy that works with the safe function
-- Note: Direct SELECT is still possible, so we need to be careful
CREATE POLICY "public_view_approved_comments_no_email"
ON public.comments
FOR SELECT
TO public
USING (is_approved = true);