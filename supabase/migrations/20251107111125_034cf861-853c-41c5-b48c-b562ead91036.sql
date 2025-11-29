-- Phase 1: Fix web_stories RLS policies and cleanup

-- First, update any existing stories with NULL user_id to have a valid user_id
-- We'll use the first admin user we can find
DO $$
DECLARE
  first_admin_id uuid;
BEGIN
  SELECT id INTO first_admin_id
  FROM public.profiles
  WHERE role = 'admin'
  LIMIT 1;
  
  IF first_admin_id IS NOT NULL THEN
    UPDATE public.web_stories
    SET user_id = first_admin_id
    WHERE user_id IS NULL;
  END IF;
END $$;

-- Make user_id NOT NULL now that we've cleaned up
ALTER TABLE public.web_stories
ALTER COLUMN user_id SET NOT NULL;

-- Phase 2: Create web_stories_config table for publisher settings
CREATE TABLE IF NOT EXISTS public.web_stories_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_name text NOT NULL DEFAULT 'TheBulletinBriefs',
  publisher_logo_url text NOT NULL DEFAULT 'https://www.thebulletinbriefs.in/logo.png',
  publisher_logo_width integer NOT NULL DEFAULT 600,
  publisher_logo_height integer NOT NULL DEFAULT 60,
  default_category text DEFAULT 'News',
  google_analytics_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on web_stories_config
ALTER TABLE public.web_stories_config ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage config
CREATE POLICY "Admins can manage web stories config"
ON public.web_stories_config
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Allow public to read config (needed for rendering)
CREATE POLICY "Anyone can read web stories config"
ON public.web_stories_config
FOR SELECT
USING (true);

-- Insert default config
INSERT INTO public.web_stories_config (
  publisher_name,
  publisher_logo_url,
  publisher_logo_width,
  publisher_logo_height,
  default_category
) VALUES (
  'TheBulletinBriefs',
  'https://www.thebulletinbriefs.in/logo.png',
  600,
  60,
  'News'
) ON CONFLICT DO NOTHING;

-- Add analytics tracking columns to web_stories
ALTER TABLE public.web_stories
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate numeric(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS avg_time_spent integer DEFAULT 0;

-- Create web_stories_analytics table
CREATE TABLE IF NOT EXISTS public.web_stories_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.web_stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  session_id text,
  event_type text NOT NULL, -- 'view', 'slide_change', 'complete', 'exit'
  slide_index integer,
  time_spent integer, -- seconds
  device_type text,
  browser text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.web_stories_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics
CREATE POLICY "Anyone can insert web stories analytics"
ON public.web_stories_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view web stories analytics"
ON public.web_stories_analytics
FOR SELECT
USING (is_admin());

-- Create function to update web story stats
CREATE OR REPLACE FUNCTION public.update_web_story_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'view' THEN
    UPDATE public.web_stories
    SET views_count = views_count + 1
    WHERE id = NEW.story_id;
  ELSIF NEW.event_type = 'complete' THEN
    -- Update completion rate
    UPDATE public.web_stories
    SET completion_rate = (
      SELECT (COUNT(*) FILTER (WHERE event_type = 'complete')::numeric / 
              NULLIF(COUNT(*) FILTER (WHERE event_type = 'view'), 0)) * 100
      FROM public.web_stories_analytics
      WHERE story_id = NEW.story_id
    )
    WHERE id = NEW.story_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-updating stats
DROP TRIGGER IF EXISTS update_web_story_stats_trigger ON public.web_stories_analytics;
CREATE TRIGGER update_web_story_stats_trigger
AFTER INSERT ON public.web_stories_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_web_story_stats();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_web_stories_status ON public.web_stories(status);
CREATE INDEX IF NOT EXISTS idx_web_stories_published_at ON public.web_stories(published_at);
CREATE INDEX IF NOT EXISTS idx_web_stories_category ON public.web_stories(category);
CREATE INDEX IF NOT EXISTS idx_web_stories_analytics_story_id ON public.web_stories_analytics(story_id);
CREATE INDEX IF NOT EXISTS idx_web_stories_analytics_event_type ON public.web_stories_analytics(event_type);