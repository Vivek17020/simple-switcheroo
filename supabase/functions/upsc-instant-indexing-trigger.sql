-- UPSC Briefs Instant Indexing Trigger
-- Run this in Supabase SQL Editor to enable instant indexing for UPSC articles

-- Create the trigger function for UPSC instant indexing
CREATE OR REPLACE FUNCTION public.trigger_instant_upsc_indexing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_upsc_article boolean := false;
BEGIN
  -- Check if this is a UPSC article (category is upscbriefs or its subcategories)
  SELECT EXISTS (
    SELECT 1 
    FROM categories c
    WHERE c.id = NEW.category_id
    AND (
      c.slug = 'upscbriefs'
      OR c.parent_id IN (
        SELECT id FROM categories WHERE slug = 'upscbriefs'
      )
    )
  ) INTO is_upsc_article;

  -- Trigger instant indexing for newly published or updated UPSC articles
  IF is_upsc_article AND NEW.published = true AND (
    (OLD.published IS NULL OR OLD.published = false) OR
    (OLD.published = true AND OLD.updated_at < NEW.updated_at)
  ) THEN
    -- Call edge function WITHOUT authorization header since verify_jwt = false
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/index-upsc-articles',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'articleId', NEW.id::text,
          'mode', 'single'
        )
      );
    
    RAISE LOG '⚡ Instant UPSC indexing triggered for article: % (slug: %)', NEW.title, NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_upsc_instant_indexing ON public.articles;

-- Create the trigger
CREATE TRIGGER trigger_upsc_instant_indexing
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_instant_upsc_indexing();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.trigger_instant_upsc_indexing() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_instant_upsc_indexing() TO service_role;

-- Verify the trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_upsc_instant_indexing';
