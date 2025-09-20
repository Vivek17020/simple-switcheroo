-- Fix security vulnerability in subscribers table
-- Drop the existing policy that exposes sensitive payment data
DROP POLICY IF EXISTS "subscription_view_own" ON public.subscribers;

-- Create a security definer function for users to check their subscription status
-- This excludes sensitive payment information
CREATE OR REPLACE FUNCTION public.get_user_subscription_status()
RETURNS TABLE(
  id uuid,
  subscribed boolean,
  subscription_tier text,
  subscription_end timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.subscribed,
    s.subscription_tier,
    s.subscription_end,
    s.created_at,
    s.updated_at
  FROM public.subscribers s
  WHERE s.user_id = auth.uid() OR s.email = auth.email()
  LIMIT 1;
$$;

-- Create a new policy for admins to view all subscriber data including payment info
CREATE POLICY "admins_view_all_subscribers"
ON public.subscribers
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Create policy for users to view only non-sensitive subscription info
-- Users should use the get_user_subscription_status() function instead
CREATE POLICY "users_limited_subscription_view"
ON public.subscribers
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid() OR email = auth.email())
  AND get_current_user_role() = 'admin'  -- Only admins can directly query sensitive data
);

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status() TO anon;