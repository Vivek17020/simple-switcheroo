-- Create trigger to auto-update learning paths when Web3 articles are published
CREATE OR REPLACE FUNCTION trigger_learning_path_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger for newly published articles
  IF NEW.published = true AND (OLD.published IS NULL OR OLD.published = false) THEN
    PERFORM
      net.http_post(
        url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-update-learning-paths',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
        ),
        body := jsonb_build_object(
          'articleId', NEW.id::text,
          'categoryId', NEW.category_id::text,
          'slug', NEW.slug,
          'title', NEW.title
        )
      );
    
    RAISE LOG 'Learning path update triggered for article: %', NEW.title;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_update_learning_paths ON articles;

-- Create trigger on articles table
CREATE TRIGGER auto_update_learning_paths
  AFTER INSERT OR UPDATE OF published ON articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_learning_path_update();

COMMENT ON FUNCTION trigger_learning_path_update() IS 'Automatically updates learning paths when Web3 articles are published by calling the auto-update-learning-paths edge function';
COMMENT ON TRIGGER auto_update_learning_paths ON articles IS 'Triggers learning path updates for newly published articles';