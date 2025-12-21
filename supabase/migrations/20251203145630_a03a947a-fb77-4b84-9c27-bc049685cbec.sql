-- Fix the instant Web3 indexing trigger - remove broken authorization header
-- Since verify_jwt = false is set in config.toml, we don't need auth headers

CREATE OR REPLACE FUNCTION public.trigger_instant_web3_indexing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Call edge function WITHOUT authorization header since verify_jwt = false
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/index-web3-articles',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
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
$function$;

-- Fix the Web3 sitemap regeneration trigger - remove broken authorization header
CREATE OR REPLACE FUNCTION public.trigger_web3_sitemap_regeneration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Call edge function WITHOUT authorization header since verify_jwt = false
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/regenerate-sitemap',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
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
$function$;

-- Ensure triggers are attached to articles table
DROP TRIGGER IF EXISTS instant_web3_indexing_trigger ON articles;
CREATE TRIGGER instant_web3_indexing_trigger
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_instant_web3_indexing();

DROP TRIGGER IF EXISTS on_web3_article_published_regenerate_sitemap ON articles;
CREATE TRIGGER on_web3_article_published_regenerate_sitemap
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_web3_sitemap_regeneration();