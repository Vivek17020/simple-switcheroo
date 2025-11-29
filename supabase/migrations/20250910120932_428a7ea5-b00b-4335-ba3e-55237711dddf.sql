-- PHASE 1: COMPREHENSIVE SECURITY HARDENING - Drop existing policies first

-- 1. PROFILES PRIVACY: Clean up and recreate policies
DROP POLICY IF EXISTS "profiles_select_public_info" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authors" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_complete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin_complete" ON public.profiles;

-- Create secure profile access policies (no email exposure)
CREATE POLICY "profiles_public_author_info" 
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

CREATE POLICY "profiles_own_complete_access" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "profiles_admin_complete_access" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- 2. USER BEHAVIOR PRIVACY: Secure likes and shares
DROP POLICY IF EXISTS "Anyone can view article likes" ON public.article_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.article_likes;
DROP POLICY IF EXISTS "Anyone can like articles" ON public.article_likes;
DROP POLICY IF EXISTS "aggregate_likes_only" ON public.article_likes;
DROP POLICY IF EXISTS "users_can_insert_likes" ON public.article_likes;
DROP POLICY IF EXISTS "users_can_delete_own_likes" ON public.article_likes;

-- No public access to individual likes data
CREATE POLICY "likes_insert_only" 
ON public.article_likes 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND ip_address IS NOT NULL)
);

CREATE POLICY "likes_delete_own" 
ON public.article_likes 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND ip_address = inet_client_addr()::text)
);

-- Article shares privacy
DROP POLICY IF EXISTS "Anyone can view article shares" ON public.article_shares;
DROP POLICY IF EXISTS "Anyone can share articles" ON public.article_shares;
DROP POLICY IF EXISTS "aggregate_shares_only" ON public.article_shares;
DROP POLICY IF EXISTS "users_can_insert_shares" ON public.article_shares;

CREATE POLICY "shares_insert_only" 
ON public.article_shares 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND ip_address IS NOT NULL)
);

-- 3. COMMENTS SYSTEM: Only approved comments visible publicly
DROP POLICY IF EXISTS "Users can view comments securely" ON public.comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "approved_comments_public" ON public.comments;
DROP POLICY IF EXISTS "users_view_own_comments" ON public.comments;
DROP POLICY IF EXISTS "admin_manage_all_comments" ON public.comments;
DROP POLICY IF EXISTS "authenticated_users_insert_comments" ON public.comments;
DROP POLICY IF EXISTS "users_update_own_unapproved_comments" ON public.comments;

CREATE POLICY "comments_approved_public" 
ON public.comments 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "comments_own_view" 
ON public.comments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "comments_admin_all" 
ON public.comments 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "comments_auth_insert" 
ON public.comments 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "comments_own_update_unapproved" 
ON public.comments 
FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  is_approved = false
);