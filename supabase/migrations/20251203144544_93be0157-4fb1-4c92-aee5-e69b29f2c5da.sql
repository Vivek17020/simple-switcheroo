-- Disable Auto Web Story Generation on Article Publish
-- Keep the indexing trigger for existing web stories, just remove auto-generation

-- Drop the instant webstory generation trigger from articles table (if exists)
DROP TRIGGER IF EXISTS trigger_instant_webstory_on_publish ON public.articles;
DROP FUNCTION IF EXISTS public.trigger_instant_webstory_generation();

-- Also drop any other auto-generation triggers on articles
DROP TRIGGER IF EXISTS auto_generate_webstory_on_publish ON public.articles;

-- Unschedule the auto-generate-trending-webstories cron job (runs twice daily)
SELECT cron.unschedule('auto-generate-trending-webstories');

-- Verify triggers are removed
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%webstory%' AND event_object_table = 'articles';