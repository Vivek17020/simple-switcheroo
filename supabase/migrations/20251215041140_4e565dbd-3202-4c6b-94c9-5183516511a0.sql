-- ============================================
-- STEP 1: Clean up duplicate Web3 triggers (keep only one of each)
-- ============================================

-- Remove duplicate Web3 indexing triggers (keep instant_web3_indexing_trigger)
DROP TRIGGER IF EXISTS trigger_web3_article_indexing ON public.articles;
DROP TRIGGER IF EXISTS trigger_web3_instant_indexing ON public.articles;

-- Remove duplicate Web3 sitemap triggers (keep on_web3_article_published_regenerate_sitemap)
DROP TRIGGER IF EXISTS trigger_web3_sitemap_on_article_publish ON public.articles;
DROP TRIGGER IF EXISTS trigger_web3_sitemap_regen ON public.articles;

-- ============================================
-- STEP 2: Create UPSC Instant Indexing Trigger
-- ============================================

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

-- Drop existing UPSC trigger if it exists
DROP TRIGGER IF EXISTS trigger_upsc_instant_indexing ON public.articles;

-- Create the UPSC trigger on articles table
CREATE TRIGGER trigger_upsc_instant_indexing
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_instant_upsc_indexing();

-- ============================================
-- STEP 3: Create UPSC Sitemap Regeneration Trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_upsc_sitemap_regeneration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_upsc_article boolean := false;
BEGIN
  -- Check if this is a UPSC article
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

  -- Only trigger if it's a UPSC article being published
  IF is_upsc_article AND NEW.published = true AND (
    (OLD.published IS NULL OR OLD.published = false) OR
    (OLD.published = true AND OLD.updated_at < NEW.updated_at)
  ) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/regenerate-sitemap',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'articleId', NEW.id::text,
          'sitemapType', 'upsc',
          'submitToGSC', true
        )
      );
    
    RAISE LOG 'UPSC sitemap regeneration triggered for article: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the UPSC sitemap trigger
DROP TRIGGER IF EXISTS trigger_upsc_sitemap_regeneration ON public.articles;
CREATE TRIGGER trigger_upsc_sitemap_regeneration
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_upsc_sitemap_regeneration();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.trigger_instant_upsc_indexing() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_instant_upsc_indexing() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_upsc_sitemap_regeneration() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_upsc_sitemap_regeneration() TO service_role;