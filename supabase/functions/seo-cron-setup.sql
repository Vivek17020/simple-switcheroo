-- Enable pg_cron extension (run this in Supabase SQL Editor)
-- This will schedule the SEO health scan to run daily at 2 AM UTC

-- First, enable the required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job to run daily at 2:00 AM UTC
SELECT cron.schedule(
  'daily-seo-health-scan',
  '0 2 * * *',  -- Run at 2:00 AM UTC every day
  $$
  SELECT
    net.http_post(
      url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/scan-seo-health',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- To check if the cron job is scheduled:
-- SELECT * FROM cron.job;

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('daily-seo-health-scan');
