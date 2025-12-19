-- Disable Web Story Automation
-- Run this SQL in Supabase SQL Editor to stop automatic web story generation

-- Drop the instant webstory trigger
DROP TRIGGER IF EXISTS trigger_instant_webstory_on_publish ON public.articles;
DROP FUNCTION IF EXISTS public.trigger_instant_webstory_generation();

-- Unschedule the daily webstory generation cron job
SELECT cron.unschedule('auto-generate-webstories-daily');

-- Verify trigger and cron job are removed
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_instant_webstory_on_publish';

SELECT * FROM cron.job WHERE jobname LIKE '%webstories%';
