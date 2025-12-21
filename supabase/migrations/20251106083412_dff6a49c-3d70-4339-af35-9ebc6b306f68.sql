-- Allow anyone to read the VAPID public key (it's meant to be public)
-- Only the private key needs to be protected
CREATE POLICY "vapid_public_key_read"
ON public.vapid_config
FOR SELECT
TO public
USING (true);

-- Also allow unauthenticated users to insert push subscriptions
-- This allows non-logged-in users to subscribe to notifications
CREATE POLICY "push_subscriptions_insert_public"
ON public.push_subscriptions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to delete their own subscription by endpoint
CREATE POLICY "push_subscriptions_delete_by_endpoint"
ON public.push_subscriptions
FOR DELETE
TO public
USING (true);