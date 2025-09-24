-- Fix critical security issues - Step 1: Email exposure and profile policies

-- 1. Remove email exposure from comments table by updating the public function
-- Drop and recreate the get_public_comments function to exclude email
DROP FUNCTION IF EXISTS public.get_public_comments(uuid);

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
    c.author_name,  -- Only name, never email
    c.user_id
  FROM public.comments c
  WHERE c.article_id = article_uuid
  AND c.is_approved = true
  ORDER BY c.created_at DESC;
$$;

-- 2. Fix overly permissive profile creation policies
-- Drop the permissive policies and replace with secure ones
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;

-- Create secure profile creation policy that only allows system/triggers to create profiles
CREATE POLICY "system_profile_creation" ON public.profiles
FOR INSERT 
WITH CHECK (
  -- Only allow if it's a system operation (no current user) or user creating their own profile
  (auth.uid() IS NULL OR auth.uid() = id)
  AND (role IS NULL OR role = 'user') -- Prevent role escalation during signup
);

-- 3. Secure the profiles update policy to prevent role self-assignment
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Users cannot change their own role unless they're admin
    COALESCE(role, 'user') = COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'user')
    OR get_current_user_role() = 'admin'
  )
);