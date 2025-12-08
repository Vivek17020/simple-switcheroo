-- Create trigger function for instant Web3 article indexing
CREATE OR REPLACE FUNCTION public.trigger_instant_web3_indexing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_web3_article boolean := false;
BEGIN
  -- Check if this is a Web3 article (category is web3forindia or its subcategories)
  SELECT EXISTS (
    SELECT 1 
    FROM categories c
    WHERE c.id = NEW.category_id
    AND (
      c.slug = 'web3forindia'
      OR c.parent_id IN (
        SELECT id FROM categories WHERE slug = 'web3forindia'
      )
    )
  ) INTO is_web3_article;

  -- Trigger instant indexing for newly published or updated Web3 articles
  IF is_web3_article AND NEW.published = true AND (
    (OLD.published IS NULL OR OLD.published = false) OR
    (OLD.published = true AND OLD.updated_at < NEW.updated_at)
  ) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/index-web3-articles',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := jsonb_build_object(
          'articleId', NEW.id::text,
          'mode', 'single'
        )
      );
    
    RAISE LOG '⚡ Instant Web3 indexing triggered for article: % (slug: %)', NEW.title, NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS instant_web3_indexing_trigger ON public.articles;

-- Create trigger that fires on INSERT and UPDATE
CREATE TRIGGER instant_web3_indexing_trigger
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_instant_web3_indexing();

COMMENT ON FUNCTION public.trigger_instant_web3_indexing() IS 'Automatically submits Web3 articles to search engines (Google, Bing, Yandex) via IndexNow for instant indexing when published or updated';
COMMENT ON TRIGGER instant_web3_indexing_trigger ON public.articles IS 'Triggers instant search engine indexing for Web3forindia articles';