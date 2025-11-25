-- Fix the trigger function to handle JSON parsing correctly
CREATE OR REPLACE FUNCTION public.trigger_search_engine_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  auth_header text;
BEGIN
  IF NEW.published = true AND (
    (OLD.published IS NULL OR OLD.published = false) OR
    (OLD.published = true AND OLD.updated_at < NEW.updated_at)
  ) THEN
    -- Get the authorization header safely
    BEGIN
      auth_header := current_setting('request.headers', true);
      IF auth_header IS NOT NULL THEN
        auth_header := (auth_header::json)->>'authorization';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      auth_header := NULL;
    END;

    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/google-index-now',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', COALESCE('Bearer ' || auth_header, '')
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