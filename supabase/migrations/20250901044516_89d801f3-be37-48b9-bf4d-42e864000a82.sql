-- Remove the public access policies that still expose email data
DROP POLICY "Public can view approved comments without emails" ON public.comments;
DROP POLICY "Authenticated users can view approved comments with limited data" ON public.comments;

-- Create a single policy that only allows viewing comments for specific scenarios
CREATE POLICY "Users can view comments securely" 
ON public.comments 
FOR SELECT 
USING (
  -- Admins can see everything
  get_current_user_role() = 'admin'
  -- Users can see their own comments (including email for editing)
  OR auth.uid() = user_id
  -- For public access, they should use the get_public_comments function instead
);