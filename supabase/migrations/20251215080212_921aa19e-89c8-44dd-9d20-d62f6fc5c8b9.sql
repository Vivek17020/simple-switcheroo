-- Fix VAPID private key exposure
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "vapid_public_key_read" ON public.vapid_config;

-- Create a secure view that only exposes the public key
CREATE OR REPLACE VIEW public.vapid_public_keys AS
SELECT id, public_key, created_at FROM public.vapid_config;

-- Grant select on the view to authenticated and anon users
GRANT SELECT ON public.vapid_public_keys TO authenticated, anon;

-- Ensure only admins can access the full table (including private_key)
DROP POLICY IF EXISTS "Only admins can manage VAPID config" ON public.vapid_config;
CREATE POLICY "Only admins can manage VAPID config"
ON public.vapid_config
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create a secure function to get the public key only (for frontend use)
CREATE OR REPLACE FUNCTION public.get_vapid_public_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public_key FROM public.vapid_config LIMIT 1;
$$;