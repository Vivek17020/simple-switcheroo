-- Fix the get_current_user_role function to properly bypass RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Use a direct query that bypasses RLS due to SECURITY DEFINER
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Return the role, or 'user' if not found
  RETURN COALESCE(user_role, 'user');
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return 'user' as default
    RETURN 'user';
END;
$$;

-- Also update the is_admin function to be more robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Use a direct query that bypasses RLS due to SECURITY DEFINER
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Return true if role is 'admin', false otherwise
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return false for security
    RETURN false;
END;
$$;