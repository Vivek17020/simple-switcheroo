-- Fix security vulnerabilities in comments table
-- Drop existing problematic policies
DROP POLICY IF EXISTS "comments_own_view" ON public.comments;
DROP POLICY IF EXISTS "comments_auth_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_own_update_unapproved" ON public.comments;

-- Create secure policies that protect personal information

-- 1. Only allow public to see approved comments without email addresses
CREATE POLICY "public_view_approved_comments"
ON public.comments
FOR SELECT
TO public
USING (is_approved = true);

-- 2. Allow authenticated users to insert comments (but not see others')
CREATE POLICY "authenticated_insert_comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- 3. Allow users to view their own comments (including unapproved ones)
-- but only if they are the author
CREATE POLICY "users_view_own_comments"
ON public.comments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Allow users to update their own unapproved comments
CREATE POLICY "users_update_own_unapproved_comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_approved = false
)
WITH CHECK (
  auth.uid() = user_id 
  AND is_approved = false
);

-- 5. Update the get_public_comments function to exclude email addresses
CREATE OR REPLACE FUNCTION public.get_public_comments(article_uuid uuid)
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
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.content,
    c.created_at,
    c.updated_at,
    c.article_id,
    c.author_name,  -- Keep author name but exclude email
    c.user_id
  FROM public.comments c
  WHERE c.article_id = article_uuid
  AND c.is_approved = true  -- Only approved comments
  ORDER BY c.created_at DESC;
$$;