-- Security hardening: remove public email exposure and tighten analytics access

-- 1) Comments: prevent public SELECT that could expose author_email
DROP POLICY IF EXISTS "comments_approved_public" ON public.comments;
-- Keep existing admin ALL and own policies intact

-- 2) Profiles: prevent public SELECT that could expose email
DROP POLICY IF EXISTS "profiles_public_author_info" ON public.profiles;
-- Owners can still SELECT their own profile via existing policy
-- Admins can still SELECT via existing admin policy

-- 3) Reading history: restrict SELECT to owner only (no anonymous/global access)
DROP POLICY IF EXISTS "Users can view their own reading history" ON public.user_reading_history;
CREATE POLICY "Users can view their own reading history (owner-only)"
ON public.user_reading_history
FOR SELECT
USING (auth.uid() = user_id);

-- 4) Reaffirm push/vapid restrictions (policies already exist); no changes required here
--    push_subscriptions: owner manage; admin view
--    vapid_config: admin only

-- 5) Likes/Shares and Analytics already protected (no public SELECT)
--    article_likes/article_shares: no SELECT; only insert/delete with constraints
--    user_analytics: admin-only SELECT; INSERT open for tracking
--    subscribers: owner-or-email SELECT; admin update only

-- NOTE: Public access to safe data should go through security definer RPCs:
--   get_public_comments, get_safe_author_profile, get_article_engagement