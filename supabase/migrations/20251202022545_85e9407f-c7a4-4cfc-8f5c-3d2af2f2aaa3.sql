-- Create trigger function for instant Video indexing
CREATE OR REPLACE FUNCTION public.trigger_instant_video_indexing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Trigger instant indexing for newly published or updated active videos
  IF NEW.is_active = true AND (
    (OLD.is_active IS NULL OR OLD.is_active = false) OR
    (OLD.is_active = true AND OLD.updated_at < NEW.updated_at)
  ) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/index-videos',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := jsonb_build_object(
          'videoId', NEW.id::text,
          'mode', 'single'
        )
      );
    
    RAISE LOG '⚡ Instant Video indexing triggered: % (category: %)', NEW.title, NEW.category;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS instant_video_indexing_trigger ON public.homepage_videos;

-- Create trigger that fires on INSERT and UPDATE
CREATE TRIGGER instant_video_indexing_trigger
  AFTER INSERT OR UPDATE ON public.homepage_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_instant_video_indexing();

COMMENT ON FUNCTION public.trigger_instant_video_indexing() IS 'Automatically submits videos to search engines (Google, Bing, Yandex) via IndexNow for instant indexing when published or updated';
COMMENT ON TRIGGER instant_video_indexing_trigger ON public.homepage_videos IS 'Triggers instant search engine indexing for active videos';