-- Drop and recreate the vapid_admin_all policy with proper WITH CHECK
DROP POLICY IF EXISTS vapid_admin_all ON public.vapid_config;

-- Create policy that allows admin full access with both USING and WITH CHECK
CREATE POLICY vapid_admin_all ON public.vapid_config
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');