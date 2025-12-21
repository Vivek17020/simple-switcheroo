-- Update the trigger to use google-index-now function for instant indexing
CREATE OR REPLACE FUNCTION public.trigger_search_engine_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.published = true AND (
    (OLD.published IS NULL OR OLD.published = false) OR
    (OLD.published = true AND OLD.updated_at < NEW.updated_at)
  ) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/google-index-now',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
        ),
        body := jsonb_build_object(
          'articleId', NEW.id::text,
          'pageType', 'article',
          'action', CASE 
            WHEN OLD.published = true THEN 'update'
            ELSE 'update'
          END
        )
      );
  END IF;
  RETURN NEW;
END;
$function$;