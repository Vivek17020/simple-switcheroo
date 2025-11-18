-- Update the trigger to also notify search engines when article is published
CREATE OR REPLACE FUNCTION public.trigger_search_engine_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify when article is being published (not just updated)
  IF NEW.published = true AND (OLD.published IS NULL OR OLD.published = false) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/notify-search-engines',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key', true) || '"}'::jsonb,
        body := json_build_object(
          'articleId', NEW.id::text
        )::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on articles table
DROP TRIGGER IF EXISTS on_article_published_notify_search ON public.articles;
CREATE TRIGGER on_article_published_notify_search
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_search_engine_notification();