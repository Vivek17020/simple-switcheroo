-- Create trigger function for instant Web Story indexing
CREATE OR REPLACE FUNCTION public.trigger_instant_webstory_indexing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Trigger instant indexing for newly published or updated web stories
  IF NEW.status = 'published' AND (
    (OLD.status IS NULL OR OLD.status != 'published') OR
    (OLD.status = 'published' AND OLD.updated_at < NEW.updated_at)
  ) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/index-webstories',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := jsonb_build_object(
          'storyId', NEW.id::text,
          'mode', 'single'
        )
      );
    
    RAISE LOG '⚡ Instant Web Story indexing triggered: % (slug: %)', NEW.title, NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS instant_webstory_indexing_trigger ON public.web_stories;

-- Create trigger that fires on INSERT and UPDATE
CREATE TRIGGER instant_webstory_indexing_trigger
  AFTER INSERT OR UPDATE ON public.web_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_instant_webstory_indexing();

COMMENT ON FUNCTION public.trigger_instant_webstory_indexing() IS 'Automatically submits web stories to search engines (Google, Bing, Yandex) via IndexNow for instant indexing when published or updated';
COMMENT ON TRIGGER instant_webstory_indexing_trigger ON public.web_stories IS 'Triggers instant search engine indexing for published web stories';