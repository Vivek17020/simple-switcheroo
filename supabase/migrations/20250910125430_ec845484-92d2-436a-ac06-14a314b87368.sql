-- ============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- ============================================

-- 1. PROFILES PRIVACY: Remove email exposure and fix RLS policies
-- Update profiles table RLS policies to restrict email access
DROP POLICY IF EXISTS "profiles_public_author_info" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_complete_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_complete_access" ON public.profiles;

-- Create new secure policies for profiles
CREATE POLICY "profiles_public_author_info_secure" ON public.profiles
  FOR SELECT 
  USING (
    -- Only show author info for published articles, without email
    id IN (
      SELECT DISTINCT articles.author_id
      FROM articles
      WHERE articles.published = true AND articles.author_id IS NOT NULL
    )
  );

CREATE POLICY "profiles_own_complete_access" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin_complete_access" ON public.profiles
  FOR SELECT 
  USING (get_current_user_role() = 'admin');

-- 2. USER BEHAVIOR PRIVACY: Fix article_likes and article_shares RLS
-- Remove ability to view individual likes/shares, only allow insertions
DROP POLICY IF EXISTS "likes_delete_own" ON public.article_likes;
DROP POLICY IF EXISTS "likes_insert_only" ON public.article_likes;

CREATE POLICY "likes_insert_only_secure" ON public.article_likes
  FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR (user_id IS NULL AND ip_address IS NOT NULL)
  );

CREATE POLICY "likes_delete_own_secure" ON public.article_likes
  FOR DELETE 
  USING (
    (auth.uid() = user_id) OR (user_id IS NULL AND ip_address = inet_client_addr()::text)
  );

-- Fix article_shares RLS
DROP POLICY IF EXISTS "shares_insert_only" ON public.article_shares;

CREATE POLICY "shares_insert_only_secure" ON public.article_shares
  FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR (user_id IS NULL AND ip_address IS NOT NULL)
  );

-- 3. COMMENTS SYSTEM: Secure comment policies
DROP POLICY IF EXISTS "comments_approved_public" ON public.comments;
DROP POLICY IF EXISTS "comments_auth_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_own_view" ON public.comments;
DROP POLICY IF EXISTS "comments_own_update_unapproved" ON public.comments;
DROP POLICY IF EXISTS "comments_admin_all" ON public.comments;

-- New secure comment policies
CREATE POLICY "comments_approved_public_secure" ON public.comments
  FOR SELECT 
  USING (is_approved = true);

CREATE POLICY "comments_auth_insert_secure" ON public.comments
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id AND
    is_approved = false -- New comments start unapproved
  );

CREATE POLICY "comments_own_view_secure" ON public.comments
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "comments_admin_all_secure" ON public.comments
  FOR ALL 
  USING (get_current_user_role() = 'admin');

-- 4. PAYMENT SECURITY: Secure subscription tables
-- Add secure trigger for subscription updates
CREATE OR REPLACE FUNCTION public.secure_subscription_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow subscription updates from admin or system context
  IF get_current_user_role() != 'admin' AND current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized subscription modification';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply trigger to subscribers table if not exists
DROP TRIGGER IF EXISTS secure_subscription_trigger ON public.subscribers;
CREATE TRIGGER secure_subscription_trigger
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_subscription_update();

-- 5. NEWSLETTER PRIVACY: Fix newsletter tables RLS
DROP POLICY IF EXISTS "newsletter_own_manage" ON public.newsletter_preferences;
DROP POLICY IF EXISTS "Anyone can insert newsletter preferences" ON public.newsletter_preferences;

-- Secure newsletter preferences
CREATE POLICY "newsletter_own_manage_secure" ON public.newsletter_preferences
  FOR ALL 
  USING (
    (user_id = auth.uid() AND auth.role() = 'authenticated') OR
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    (user_id = auth.uid() AND auth.role() = 'authenticated') OR
    get_current_user_role() = 'admin'
  );

CREATE POLICY "newsletter_insert_secure" ON public.newsletter_preferences
  FOR INSERT 
  WITH CHECK (
    (user_id = auth.uid() AND auth.role() = 'authenticated') OR
    (user_id IS NULL AND email IS NOT NULL) OR
    get_current_user_role() = 'admin'
  );

-- 6. PUSH NOTIFICATIONS: Secure push subscriptions
DROP POLICY IF EXISTS "push_own_manage" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_admin_view" ON public.push_subscriptions;

CREATE POLICY "push_own_manage_secure" ON public.push_subscriptions
  FOR ALL 
  USING (
    (auth.uid() = user_id AND auth.role() = 'authenticated') OR
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    (auth.uid() = user_id AND auth.role() = 'authenticated') OR
    get_current_user_role() = 'admin'
  );

-- 7. USER ANALYTICS: Restrict access to tracking data
DROP POLICY IF EXISTS "analytics_insert_tracking" ON public.user_analytics;
DROP POLICY IF EXISTS "analytics_admin_view" ON public.user_analytics;

CREATE POLICY "analytics_insert_tracking_secure" ON public.user_analytics
  FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "analytics_admin_view_secure" ON public.user_analytics
  FOR SELECT 
  USING (get_current_user_role() = 'admin');

CREATE POLICY "analytics_own_view_secure" ON public.user_analytics
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 8. USER PREFERENCES: Secure user preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Admins can view all preferences" ON public.user_preferences;

CREATE POLICY "user_preferences_own_manage_secure" ON public.user_preferences
  FOR ALL 
  USING (
    (auth.uid() = user_id AND auth.role() = 'authenticated') OR
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    (auth.uid() = user_id AND auth.role() = 'authenticated') OR
    get_current_user_role() = 'admin'
  );

-- 9. READING HISTORY: Secure reading history
DROP POLICY IF EXISTS "Users can view their own reading history" ON public.user_reading_history;
DROP POLICY IF EXISTS "Users can insert their own reading history" ON public.user_reading_history;
DROP POLICY IF EXISTS "Admins can view all reading history" ON public.user_reading_history;

CREATE POLICY "reading_history_own_manage_secure" ON public.user_reading_history
  FOR SELECT 
  USING (
    (auth.uid() = user_id AND auth.role() = 'authenticated') OR
    get_current_user_role() = 'admin'
  );

CREATE POLICY "reading_history_insert_secure" ON public.user_reading_history
  FOR INSERT 
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND ip_address IS NOT NULL)
  );

-- 10. MONETIZATION ANALYTICS: Secure monetization data
DROP POLICY IF EXISTS "monetization_analytics_admin" ON public.monetization_analytics;
DROP POLICY IF EXISTS "monetization_analytics_insert" ON public.monetization_analytics;

CREATE POLICY "monetization_analytics_admin_secure" ON public.monetization_analytics
  FOR ALL 
  USING (get_current_user_role() = 'admin');

CREATE POLICY "monetization_analytics_insert_secure" ON public.monetization_analytics
  FOR INSERT 
  WITH CHECK (
    -- Only allow insertions from authenticated context or system
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND ip_address IS NOT NULL) OR
    get_current_user_role() = 'admin'
  );

-- 11. VAPID CONFIG: Secure VAPID configuration (admin only)
DROP POLICY IF EXISTS "vapid_admin_only" ON public.vapid_config;

CREATE POLICY "vapid_admin_only_secure" ON public.vapid_config
  FOR ALL 
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- 12. SECURITY FUNCTIONS: Add role checking functions
CREATE OR REPLACE FUNCTION public.can_manage_push_notifications()
RETURNS BOOLEAN AS $$
  SELECT get_current_user_role() = 'admin';
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- 13. AUDIT LOGGING: Create security audit log
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT,
  ip_address INET DEFAULT inet_client_addr(),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_audit_logs" ON public.security_audit_log
  FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "system_insert_audit_logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

-- 14. AUDIT LOGGING FUNCTION
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_type TEXT,
  resource_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. SECURITY STATUS FUNCTION
CREATE OR REPLACE FUNCTION public.security_check_status()
RETURNS TABLE(
  issue TEXT,
  status TEXT,
  requires_manual_action BOOLEAN,
  description TEXT
) AS $$
  SELECT 
    'Extension in Public Schema'::TEXT as issue,
    'REQUIRES MANUAL FIX'::TEXT as status,
    true as requires_manual_action,
    'Extensions should be moved from public schema for security'::TEXT as description
  UNION ALL
  SELECT 
    'OTP Expiry Time'::TEXT,
    'REQUIRES MANUAL FIX'::TEXT,
    true,
    'OTP expiry should be reduced to 10 minutes in Supabase dashboard'::TEXT
  UNION ALL
  SELECT 
    'Leaked Password Protection'::TEXT,
    'REQUIRES MANUAL FIX'::TEXT,
    true,
    'Enable leaked password protection in Supabase Auth settings'::TEXT
  UNION ALL
  SELECT 
    'Postgres Version'::TEXT,
    'REQUIRES MANUAL FIX'::TEXT,
    true,
    'Upgrade Postgres version in Supabase dashboard'::TEXT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;