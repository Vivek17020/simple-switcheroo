-- Fix Web Story Instant Indexing Trigger
-- The previous trigger failed silently because current_setting returned NULL

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_instant_webstory_on_publish ON public.web_stories;
DROP FUNCTION IF EXISTS public.trigger_webstory_instant_indexing();

-- Create improved function to trigger instant web story indexing
CREATE OR REPLACE FUNCTION public.trigger_webstory_instant_indexing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger for newly published web stories
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Call edge function to index the web story
    -- Using anon key which is safe for public edge function calls
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/index-webstories',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU'
        ),
        body := jsonb_build_object(
          'storyId', NEW.id::text,
          'mode', 'single'
        )
      );
    
    RAISE LOG 'Web story instant indexing triggered for: % (ID: %)', NEW.title, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on web_stories table
CREATE TRIGGER trigger_instant_webstory_on_publish
  AFTER INSERT OR UPDATE OF status, published_at
  ON public.web_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_webstory_instant_indexing();

-- Verify trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_instant_webstory_on_publish';