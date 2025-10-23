-- PHASE 2: PAYMENT, PUSH NOTIFICATIONS & REMAINING SECURITY

-- 4. PAYMENT SECURITY: Restrict subscription updates
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "users_view_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "system_insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "admin_or_webhook_update_subscription" ON public.subscribers;

-- Enhanced subscription security
CREATE POLICY "subscription_view_own" 
ON public.subscribers 
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  (email = auth.email())
);

CREATE POLICY "subscription_insert_auth" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' OR 
  get_current_user_role() = 'admin'
);

CREATE POLICY "subscription_update_admin_only" 
ON public.subscribers 
FOR UPDATE 
USING (get_current_user_role() = 'admin');

-- 5. PUSH SUBSCRIPTIONS SECURITY
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "users_manage_own_push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "admin_view_push_subscriptions" ON public.push_subscriptions;

CREATE POLICY "push_own_manage" 
ON public.push_subscriptions 
FOR ALL 
USING (
  auth.uid() = user_id AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "push_admin_view" 
ON public.push_subscriptions 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- 6. VAPID KEYS SECURITY: Admin only access
DROP POLICY IF EXISTS "Only admins can manage VAPID keys" ON public.vapid_config;
DROP POLICY IF EXISTS "vapid_admin_only_access" ON public.vapid_config;

CREATE POLICY "vapid_admin_only" 
ON public.vapid_config 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- 7. NEWSLETTER SECURITY
DROP POLICY IF EXISTS "Users can manage their own newsletter preferences" ON public.newsletter_preferences;
DROP POLICY IF EXISTS "users_manage_own_newsletter" ON public.newsletter_preferences;

CREATE POLICY "newsletter_own_manage" 
ON public.newsletter_preferences 
FOR ALL 
USING (
  (user_id = auth.uid() AND auth.role() = 'authenticated') OR 
  (user_id IS NULL AND email = auth.email())
);

-- 8. ANALYTICS SECURITY
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Insert analytics events" ON public.user_analytics;
DROP POLICY IF EXISTS "admin_analytics_access" ON public.user_analytics;
DROP POLICY IF EXISTS "system_insert_analytics" ON public.user_analytics;

CREATE POLICY "analytics_admin_view" 
ON public.user_analytics 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "analytics_insert_tracking" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (true);

-- 9. MONETIZATION ANALYTICS SECURITY
DROP POLICY IF EXISTS "admins_manage_analytics" ON public.monetization_analytics;
DROP POLICY IF EXISTS "insert_analytics_events" ON public.monetization_analytics;
DROP POLICY IF EXISTS "admin_monetization_analytics" ON public.monetization_analytics;
DROP POLICY IF EXISTS "system_insert_monetization_analytics" ON public.monetization_analytics;

CREATE POLICY "monetization_analytics_admin" 
ON public.monetization_analytics 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "monetization_analytics_insert" 
ON public.monetization_analytics 
FOR INSERT 
WITH CHECK (true);

-- 10. CREATE SECURITY FUNCTIONS

-- Function to get safe user profile data (no email exposure)
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

-- Enhanced security trigger for subscription updates
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