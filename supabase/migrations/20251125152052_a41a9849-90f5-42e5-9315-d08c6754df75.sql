-- Create database trigger to regenerate sitemaps when Web3 articles are published
-- This trigger calls the regenerate-sitemap edge function

CREATE OR REPLACE FUNCTION trigger_web3_sitemap_regeneration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Only trigger if it's a Web3 article being published
  IF is_web3_article AND NEW.published = true AND (
    (OLD.published IS NULL OR OLD.published = false) OR
    (OLD.published = true AND OLD.updated_at < NEW.updated_at)
  ) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/regenerate-sitemap',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := jsonb_build_object(
          'articleId', NEW.id::text,
          'sitemapType', 'web3',
          'submitToGSC', true
        )
      );
    
    RAISE LOG 'Web3 sitemap regeneration triggered for article: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_web3_sitemap_on_article_publish ON articles;

-- Create trigger for Web3 article publish/update
CREATE TRIGGER trigger_web3_sitemap_on_article_publish
  AFTER INSERT OR UPDATE OF published, updated_at ON articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_web3_sitemap_regeneration();

-- Comment explaining the trigger
COMMENT ON FUNCTION trigger_web3_sitemap_regeneration() IS 
  'Automatically regenerates Web3 sitemap and submits to Google Search Console when Web3 articles are published or updated';