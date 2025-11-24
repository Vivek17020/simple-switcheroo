-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_article_publish_notify_search_engines ON public.articles;

-- Update the trigger function to ping on both publish AND updates
CREATE OR REPLACE FUNCTION public.trigger_search_engine_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Notify search engines when:
  -- 1. Article is being published for the first time (OLD.published = false, NEW.published = true)
  -- 2. Article is updated after being published (OLD.published = true, NEW.published = true)
  IF NEW.published = true AND (
    (OLD.published IS NULL OR OLD.published = false) OR  -- Initial publish
    (OLD.published = true AND OLD.updated_at < NEW.updated_at)  -- Update to published article
  ) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/notify-search-engines',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'articleId', NEW.id::text,
          'isUpdate', (OLD.published = true)::boolean
        )
      );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_article_publish_notify_search_engines
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_search_engine_notification();

-- Add canonical_url column to articles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'articles' 
    AND column_name = 'canonical_url'
  ) THEN
    ALTER TABLE public.articles 
    ADD COLUMN canonical_url TEXT;
    
    -- Auto-populate canonical URLs for existing articles
    UPDATE public.articles 
    SET canonical_url = 'https://www.thebulletinbriefs.in/article/' || slug 
    WHERE canonical_url IS NULL AND slug IS NOT NULL;
  END IF;
END $$;

-- Create function to auto-generate canonical URL on insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_canonical_url()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Auto-generate canonical URL if not provided
  IF NEW.canonical_url IS NULL OR NEW.canonical_url = '' THEN
    NEW.canonical_url := 'https://www.thebulletinbriefs.in/article/' || NEW.slug;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-generate canonical URL
DROP TRIGGER IF EXISTS auto_generate_canonical_url_trigger ON public.articles;
CREATE TRIGGER auto_generate_canonical_url_trigger
  BEFORE INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_canonical_url();