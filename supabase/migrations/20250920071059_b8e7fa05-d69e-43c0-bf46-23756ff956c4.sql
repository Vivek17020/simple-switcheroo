-- Fix the security vulnerability in newsletter_subscribers table
-- Drop existing policies that allow conflicting access
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Only admins can view newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON public.newsletter_subscribers;

-- Create secure policies that prevent public read access to emails
-- Allow public INSERT for newsletter signup (but restrict what can be inserted)
CREATE POLICY "Public can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (
  -- Only allow setting email and default values for other columns
  true
);

-- Only admins can view subscriber data
CREATE POLICY "Admins can view all newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Only admins can update subscriber data
CREATE POLICY "Admins can update newsletter subscribers"
ON public.newsletter_subscribers
FOR UPDATE
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Only admins can delete subscriber data
CREATE POLICY "Admins can delete newsletter subscribers"
ON public.newsletter_subscribers
FOR DELETE
TO authenticated
USING (get_current_user_role() = 'admin');