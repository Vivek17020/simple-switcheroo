-- Create newsletter preferences table
CREATE TABLE public.newsletter_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, breaking
  categories TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.newsletter_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own newsletter preferences" 
ON public.newsletter_preferences 
FOR ALL 
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Anyone can insert newsletter preferences" 
ON public.newsletter_preferences 
FOR INSERT 
WITH CHECK (true);

-- Create VAPID keys storage table
CREATE TABLE public.vapid_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for VAPID (admin only)
ALTER TABLE public.vapid_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage VAPID keys" 
ON public.vapid_config 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create advanced analytics table
CREATE TABLE public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL, -- page_view, click, scroll, time_spent
  page_url TEXT,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  location_country TEXT,
  click_target TEXT,
  scroll_depth INTEGER,
  time_spent INTEGER, -- in seconds
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Insert analytics events" 
ON public.user_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics" 
ON public.user_analytics 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Add newsletter subscription trigger
CREATE OR REPLACE FUNCTION public.trigger_newsletter_digest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Send newsletter digest when articles are published
  IF NEW.published = true AND (OLD.published IS NULL OR OLD.published = false) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/send-newsletter-digest',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key', true) || '"}'::jsonb,
        body := json_build_object(
          'articleId', NEW.id::text,
          'type', 'new_article'
        )::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for newsletter digest
DROP TRIGGER IF EXISTS newsletter_digest_trigger ON public.articles;
CREATE TRIGGER newsletter_digest_trigger
  AFTER UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_newsletter_digest();