-- Database trigger to auto-generate web stories INSTANTLY when articles publish
-- This ensures web stories are created within seconds of article publication

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_instant_webstory_on_publish ON public.articles;
DROP FUNCTION IF EXISTS public.trigger_instant_webstory_generation();

-- Create function to trigger instant web story generation
CREATE OR REPLACE FUNCTION public.trigger_instant_webstory_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger for newly published articles (not updates)
  IF NEW.published = true AND (OLD.published IS NULL OR OLD.published = false) THEN
    -- Call edge function to generate web story instantly
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/trigger-instant-webstory',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU'
        ),
        body := jsonb_build_object(
          'articleId', NEW.id::text
        )
      );
    
    RAISE LOG 'Instant web story generation triggered for article: %', NEW.title;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on articles table
CREATE TRIGGER trigger_instant_webstory_on_publish
  AFTER INSERT OR UPDATE OF published, published_at
  ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_instant_webstory_generation();

-- Verify trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_instant_webstory_on_publish';
