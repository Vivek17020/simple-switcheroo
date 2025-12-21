-- Disable automatic web story generation
-- Web stories will only be generated when manually clicking the button next to articles

-- 1. Drop the instant trigger that auto-generates web stories when articles publish
DROP TRIGGER IF EXISTS trigger_instant_webstory_on_publish ON public.articles;

-- 2. Drop the associated trigger function
DROP FUNCTION IF EXISTS public.trigger_instant_webstory_generation();

-- 3. Try to remove the daily cron job if pg_cron is available
DO $$
BEGIN
  PERFORM cron.unschedule('auto-generate-webstories-daily');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Cron job does not exist or pg_cron not available';
END $$;