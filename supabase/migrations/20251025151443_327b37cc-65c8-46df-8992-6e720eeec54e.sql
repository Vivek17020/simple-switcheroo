-- Fix vapid_config RLS policy to allow INSERT/UPDATE for admins
DROP POLICY IF EXISTS "vapid_admin_only" ON public.vapid_config;

CREATE POLICY "vapid_admin_all"
ON public.vapid_config
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Also ensure the function has proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;