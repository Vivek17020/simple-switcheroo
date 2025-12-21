-- Create trigger function to send OneSignal notification when article is published
CREATE OR REPLACE FUNCTION public.trigger_onesignal_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Send OneSignal notification when article is published (new or updated)
  IF NEW.published = true AND (
    (OLD.published IS NULL OR OLD.published = false) OR  -- Initial publish
    (OLD.published = true AND OLD.updated_at < NEW.updated_at)  -- Update to published article
  ) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/send-onesignal-notification',
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
$$;

-- Create trigger for OneSignal notifications on article publish
DROP TRIGGER IF EXISTS on_article_publish_onesignal ON public.articles;
CREATE TRIGGER on_article_publish_onesignal
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_onesignal_notification();

-- Drop the old newsletter trigger to disable email alerts
DROP TRIGGER IF EXISTS on_article_publish_newsletter ON public.articles;
DROP TRIGGER IF EXISTS on_article_digest ON public.articles;

-- Keep search engine notification trigger (it's separate from email)
-- The trigger_search_engine_notification function will remain active