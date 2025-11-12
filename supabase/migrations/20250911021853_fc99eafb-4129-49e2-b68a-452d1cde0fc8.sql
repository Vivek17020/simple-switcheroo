-- Database Security Hardening Migration
-- This migration implements comprehensive security controls for production

-- 1. CREATE EXTENSIONS SCHEMA AND MOVE EXTENSIONS
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move existing extensions to extensions schema (if they exist)
-- Note: Some extensions may already be in extensions schema
DO $$
BEGIN
    -- Try to move pgcrypto if it exists in public
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER EXTENSION pgcrypto SET SCHEMA extensions;
    END IF;
    
    -- Try to move uuid-ossp if it exists in public
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
    END IF;
    
    -- Try to move other common extensions
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citext' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER EXTENSION citext SET SCHEMA extensions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'ltree' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER EXTENSION ltree SET SCHEMA extensions;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log but continue if moving extensions fails
        RAISE NOTICE 'Could not move some extensions: %', SQLERRM;
END $$;

-- 2. REVOKE CREATE PERMISSIONS ON PUBLIC SCHEMA
REVOKE CREATE ON SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 3. AUDIT EXISTING SECURITY DEFINER FUNCTIONS
-- Create a view to monitor SECURITY DEFINER functions
CREATE OR REPLACE VIEW security_definer_functions AS
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    r.rolname as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON p.proowner = r.oid
WHERE p.prosecdef = true
AND n.nspname = 'public'
ORDER BY n.nspname, p.proname;

-- Grant admin access to view security definer functions
GRANT SELECT ON security_definer_functions TO service_role;

-- 4. ENSURE ALL TABLES HAVE RLS ENABLED
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' 
            AND c.relname = tablename
            AND c.relrowsecurity = true
        )
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 
                      table_record.schemaname, table_record.tablename);
        RAISE NOTICE 'Enabled RLS on table: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- 5. ENHANCE SECURITY AUDIT LOG TABLE (if needed)
-- The table already exists, but let's ensure it has proper triggers

-- Create function to automatically log security events
CREATE OR REPLACE FUNCTION log_security_event_auto()
RETURNS TRIGGER AS $$
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
        TG_OP,
        TG_TABLE_NAME,
        inet_client_addr(),
        now()
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_trigger_subscribers ON public.subscribers;
CREATE TRIGGER audit_trigger_subscribers
    AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
    FOR EACH ROW EXECUTE FUNCTION log_security_event_auto();

DROP TRIGGER IF EXISTS audit_trigger_profiles ON public.profiles;
CREATE TRIGGER audit_trigger_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION log_security_event_auto();

DROP TRIGGER IF EXISTS audit_trigger_articles ON public.articles;
CREATE TRIGGER audit_trigger_articles
    AFTER INSERT OR UPDATE OR DELETE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION log_security_event_auto();

-- 6. ROLE PERMISSION CLEANUP
-- Ensure anon can only SELECT from safe public views/functions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant only necessary SELECT permissions to anon
GRANT SELECT ON public.articles TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.languages TO anon;
GRANT SELECT ON public.affiliate_products TO anon;
GRANT SELECT ON public.daily_trending_scores TO anon;
GRANT SELECT ON public.exam_papers TO anon;

-- Grant execute on safe public functions to anon
GRANT EXECUTE ON FUNCTION public.get_public_comments(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_safe_author_profile(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_article_engagement(uuid) TO anon;

-- Restrict authenticated role permissions on sensitive tables
REVOKE ALL ON public.subscribers FROM authenticated;
REVOKE ALL ON public.security_audit_log FROM authenticated;
REVOKE ALL ON public.vapid_config FROM authenticated;
REVOKE ALL ON public.monetization_analytics FROM authenticated;

-- Grant only necessary permissions to authenticated
GRANT SELECT, INSERT ON public.user_reading_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.article_likes TO authenticated;
GRANT SELECT, INSERT ON public.article_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.newsletter_preferences TO authenticated;

-- 7. CREATE SECURITY MONITORING VIEW
CREATE OR REPLACE VIEW security_overview AS
SELECT 
    'RLS Status' as check_type,
    schemaname || '.' || tablename as object_name,
    CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = t.schemaname
WHERE t.schemaname = 'public'

UNION ALL

SELECT 
    'Extensions in Public' as check_type,
    extname as object_name,
    CASE WHEN n.nspname = 'public' THEN 'RISKY' ELSE 'SAFE' END as status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid

UNION ALL

SELECT 
    'Security Definer Functions' as check_type,
    nspname || '.' || proname as object_name,
    'REVIEW REQUIRED' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true AND n.nspname = 'public'

ORDER BY check_type, status DESC;

-- Grant admin access to security overview
GRANT SELECT ON security_overview TO service_role;

-- 8. CREATE SECURITY POLICY VALIDATION
CREATE OR REPLACE FUNCTION validate_security_policies()
RETURNS TABLE(
    table_name text,
    has_rls boolean,
    policy_count integer,
    public_access boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        COALESCE(c.relrowsecurity, false) as has_rls,
        COALESCE(pol_count.count, 0)::integer as policy_count,
        COALESCE(pub_access.has_public, false) as public_access
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_namespace n ON c.relnamespace = n.oid AND n.nspname = t.schemaname
    LEFT JOIN (
        SELECT schemaname, tablename, COUNT(*) as count
        FROM pg_policies 
        GROUP BY schemaname, tablename
    ) pol_count ON pol_count.schemaname = t.schemaname AND pol_count.tablename = t.tablename
    LEFT JOIN (
        SELECT schemaname, tablename, true as has_public
        FROM pg_policies 
        WHERE qual IS NULL OR qual = 'true'
        GROUP BY schemaname, tablename
    ) pub_access ON pub_access.schemaname = t.schemaname AND pub_access.tablename = t.tablename
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION validate_security_policies() TO service_role;

-- 9. LOG COMPLETION
INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource,
    created_at
) VALUES (
    NULL,
    'DATABASE_HARDENING_COMPLETE',
    'SYSTEM_WIDE_SECURITY_UPGRADE',
    now()
);

-- Success message
SELECT 'Database hardening migration completed successfully. Review security_overview view for status.' as result;