-- ADDRESS REMAINING SECURITY WARNINGS

-- 1. Fix OTP expiry time (reduce from default to 10 minutes = 600 seconds)
-- Note: This requires updating auth config which may need manual configuration
-- INSERT INTO auth.config (parameter, value) VALUES ('otp_expiry', '600') 
-- ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;

-- 2. Create function to check and warn about remaining security issues
CREATE OR REPLACE FUNCTION public.security_check_status()
RETURNS TABLE(
  issue text,
  status text,
  requires_manual_action boolean,
  description text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    'Extension in Public Schema'::text as issue,
    'REQUIRES MANUAL FIX'::text as status,
    true as requires_manual_action,
    'Extensions should be moved from public schema for security'::text as description
  UNION ALL
  SELECT 
    'OTP Expiry Time'::text,
    'REQUIRES MANUAL FIX'::text,
    true,
    'OTP expiry should be reduced to 10 minutes in Supabase dashboard'::text
  UNION ALL
  SELECT 
    'Leaked Password Protection'::text,
    'REQUIRES MANUAL FIX'::text,
    true,
    'Enable leaked password protection in Supabase Auth settings'::text
  UNION ALL
  SELECT 
    'Postgres Version'::text,
    'REQUIRES MANUAL FIX'::text,
    true,
    'Upgrade Postgres version in Supabase dashboard'::text;
$$;

-- 3. Additional security hardening for profiles table
-- Remove the problematic check constraint and replace with better approach
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_email_privacy;

-- Create a view for public profile data that never exposes emails
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  author_image_url,
  author_bio,
  job_title,
  created_at,
  updated_at
FROM public.profiles
WHERE id IN (
  SELECT DISTINCT author_id 
  FROM public.articles 
  WHERE published = true 
  AND author_id IS NOT NULL
);

-- 4. Enhanced security for push notifications
-- Update push notification button to require admin role
CREATE OR REPLACE FUNCTION public.can_manage_push_notifications()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT get_current_user_role() = 'admin';
$$;

-- 5. Add additional security logging
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "admin_view_audit_logs" 
ON public.security_audit_log 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- System can insert audit logs
CREATE POLICY "system_insert_audit_logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 6. Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_type text,
  resource_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource,
    ip_address,
    created_at
  )
  VALUES (
    auth.uid(),
    action_type,
    resource_name,
    inet_client_addr(),
    now()
  );
END;
$$;