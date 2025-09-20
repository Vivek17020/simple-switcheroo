-- Ensure RLS is enabled on newsletter_subscribers (should already be enabled)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create a restrictive default policy to deny all access by default
-- Then explicit policies will override this for specific cases
CREATE POLICY "Deny all by default"
ON public.newsletter_subscribers
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Override with specific policies for newsletter subscription
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;

CREATE POLICY "Allow public newsletter subscription"
ON public.newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (
  -- Allow anyone to insert their email for newsletter subscription
  email IS NOT NULL AND length(email) > 0
);