-- Schedule daily SEO verification recheck (runs at 3 AM UTC)
SELECT cron.schedule(
  'daily-seo-verification-recheck',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/recheck-seo-verification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- To check scheduled cron jobs:
-- SELECT * FROM cron.job WHERE jobname LIKE '%seo%';

-- To manually unschedule (if needed):
-- SELECT cron.unschedule('daily-seo-verification-recheck');
