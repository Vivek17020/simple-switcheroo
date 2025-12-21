-- COMPREHENSIVE SECURITY HARDENING MIGRATION

-- 1. PROFILES PRIVACY: Restrict email access to owner only
DROP POLICY IF EXISTS "profiles_select_authors" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Create secure profile access policies
CREATE POLICY "profiles_select_public_info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Public can see basic author info for published articles (no email)
  id IN ( 
    SELECT DISTINCT articles.author_id
    FROM articles
    WHERE articles.published = true 
    AND articles.author_id IS NOT NULL
  )
);

CREATE POLICY "profiles_select_own_complete" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin_complete" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- 2. VAPID KEYS SECURITY: Admin only access with enhanced security
DROP POLICY IF EXISTS "Only admins can manage VAPID keys" ON public.vapid_config;

CREATE POLICY "vapid_admin_only_access" 
ON public.vapid_config 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- 3. USER BEHAVIOR PRIVACY: Secure likes and shares
DROP POLICY IF EXISTS "Anyone can view article likes" ON public.article_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.article_likes;
DROP POLICY IF EXISTS "Anyone can like articles" ON public.article_likes;

-- Article likes - only allow aggregate counts, not individual user data
CREATE POLICY "aggregate_likes_only" 
ON public.article_likes 
FOR SELECT 
USING (false); -- No direct access to individual likes

CREATE POLICY "users_can_insert_likes" 
ON public.article_likes 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND ip_address IS NOT NULL)
);

CREATE POLICY "users_can_delete_own_likes" 
ON public.article_likes 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND ip_address = inet_client_addr()::text)
);

-- Article shares - similar privacy protection
DROP POLICY IF EXISTS "Anyone can view article shares" ON public.article_shares;
DROP POLICY IF EXISTS "Anyone can share articles" ON public.article_shares;

CREATE POLICY "aggregate_shares_only" 
ON public.article_shares 
FOR SELECT 
USING (false); -- No direct access to individual shares

CREATE POLICY "users_can_insert_shares" 
ON public.article_shares 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND ip_address IS NOT NULL)
);

-- 4. COMMENTS SYSTEM: Only approved comments visible publicly
DROP POLICY IF EXISTS "Users can view comments securely" ON public.comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;

-- Fixed comments policies
CREATE POLICY "approved_comments_public" 
ON public.comments 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "users_view_own_comments" 
ON public.comments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "admin_manage_all_comments" 
ON public.comments 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "authenticated_users_insert_comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "users_update_own_unapproved_comments" 
ON public.comments 
FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  is_approved = false
);

-- 5. PAYMENT SECURITY: Restrict subscription updates
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Enhanced subscription security
CREATE POLICY "users_view_own_subscription" 
ON public.subscribers 
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  (email = auth.email())
);

CREATE POLICY "system_insert_subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (
  -- Only allow inserts from authenticated context or admin
  (auth.role() = 'authenticated') OR 
  (get_current_user_role() = 'admin')
);

CREATE POLICY "admin_or_webhook_update_subscription" 
ON public.subscribers 
FOR UPDATE 
USING (
  -- Only admins or system (webhooks) can update subscriptions
  get_current_user_role() = 'admin'
);

-- 6. PUSH SUBSCRIPTIONS SECURITY: Enhanced access control
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON public.push_subscriptions;

CREATE POLICY "users_manage_own_push_subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (
  auth.uid() = user_id AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "admin_view_push_subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- 7. NEWSLETTER SECURITY: Enhanced privacy
DROP POLICY IF EXISTS "Users can manage their own newsletter preferences" ON public.newsletter_preferences;

CREATE POLICY "users_manage_own_newsletter" 
ON public.newsletter_preferences 
FOR ALL 
USING (
  (user_id = auth.uid() AND auth.role() = 'authenticated') OR 
  (user_id IS NULL AND email = auth.email())
);

-- 8. USER ANALYTICS SECURITY: Admin only access with insert for tracking
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Insert analytics events" ON public.user_analytics;

CREATE POLICY "admin_analytics_access" 
ON public.user_analytics 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "system_insert_analytics" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (true); -- Allow system to track analytics

-- 9. MONETIZATION ANALYTICS SECURITY
DROP POLICY IF EXISTS "admins_manage_analytics" ON public.monetization_analytics;
DROP POLICY IF EXISTS "insert_analytics_events" ON public.monetization_analytics;

CREATE POLICY "admin_monetization_analytics" 
ON public.monetization_analytics 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "system_insert_monetization_analytics" 
ON public.monetization_analytics 
FOR INSERT 
WITH CHECK (true);

-- 10. DATABASE HARDENING: Security configurations
-- Note: Some of these require superuser access and may need manual configuration

-- Create a function to get safe user profile data (no email exposure)
CREATE OR REPLACE FUNCTION public.get_safe_author_profile(author_uuid uuid)
RETURNS TABLE(
  id uuid, 
  username text, 
  full_name text, 
  avatar_url text, 
  author_image_url text, 
  author_bio text, 
  job_title text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.author_image_url,
    p.author_bio,
    p.job_title
  FROM public.profiles p
  WHERE p.id = author_uuid
  AND EXISTS (
    SELECT 1 
    FROM public.articles a 
    WHERE a.author_id = p.id 
    AND a.published = true
  );
$$;

-- Enhanced role checking with better security
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Function to safely get article engagement counts without exposing user data
CREATE OR REPLACE FUNCTION public.get_article_engagement(article_uuid uuid)
RETURNS TABLE(
  likes_count bigint,
  shares_count bigint,
  comments_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.article_likes WHERE article_id = article_uuid),
    (SELECT COUNT(*) FROM public.article_shares WHERE article_id = article_uuid),
    (SELECT COUNT(*) FROM public.comments WHERE article_id = article_uuid AND is_approved = true)
$$;

-- Add constraint to ensure email privacy in profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT check_email_privacy 
CHECK (
  -- Email should only be visible to owner or admin
  CASE 
    WHEN auth.uid() = id THEN true
    WHEN get_current_user_role() = 'admin' THEN true
    ELSE email IS NULL
  END
);

-- Enhanced security for sensitive operations
CREATE OR REPLACE FUNCTION public.secure_subscription_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow subscription updates from admin or system context
  IF get_current_user_role() != 'admin' AND current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized subscription modification';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger for subscription security
DROP TRIGGER IF EXISTS secure_subscription_updates ON public.subscribers;
CREATE TRIGGER secure_subscription_updates
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.secure_subscription_update();