-- Add explicit SELECT policy for newsletter subscribers to prevent email harvesting
CREATE POLICY "Only admins can view newsletter subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (get_current_user_role() = 'admin');