-- Drop security definer views that pose security risks
DROP VIEW IF EXISTS public.security_definer_functions;
DROP VIEW IF EXISTS public.security_overview;

-- Keep public_profiles view but make it a regular view (not security definer)
-- The public_profiles view is actually useful for showing author profiles
-- It's already safe because it only shows profiles of users who have published articles