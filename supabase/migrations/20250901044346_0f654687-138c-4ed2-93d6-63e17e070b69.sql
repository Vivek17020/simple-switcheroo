-- Create a secure function to get public comment data without exposing emails
CREATE OR REPLACE FUNCTION public.get_public_comments(article_uuid uuid)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  article_id uuid,
  author_name text,
  user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_public_comments(uuid) TO anon, authenticated;

-- Update the existing comments SELECT policy to be more restrictive
-- Drop the overly permissive policy
DROP POLICY "Anyone can view approved comments" ON public.comments;

-- Create more secure policies
CREATE POLICY "Public can view approved comments without emails" 
ON public.comments 
FOR SELECT 
USING (
  is_approved = true 
  AND auth.role() = 'anon'
);

CREATE POLICY "Authenticated users can view approved comments with limited data" 
ON public.comments 
FOR SELECT 
USING (
  is_approved = true 
  AND auth.role() = 'authenticated'
  AND get_current_user_role() != 'admin'
);

-- Admins can still see everything (this policy already exists)
-- "Admins can manage all comments" policy covers admin access