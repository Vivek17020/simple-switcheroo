-- Setup cron jobs for web story automation
-- This migration creates two cron jobs:
-- 1. auto-generate-trending-webstories: Runs twice daily (9 AM & 6 PM IST)
-- 2. auto-publish-web-story: Runs every 30 minutes to publish approved stories

-- Note: Extensions (pg_cron, pg_net) should already be enabled
-- If you get extension errors, they are already enabled

-- Create cron job to auto-generate trending web stories twice daily
-- Runs at 9:00 AM and 6:00 PM IST (3:30 AM and 12:30 PM UTC)
SELECT cron.schedule(
  'auto-generate-trending-webstories-morning',
  '30 3 * * *', -- 9:00 AM IST
  $$
  SELECT
    net.http_post(
      url:='https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-generate-trending-webstories',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU"}'::jsonb,
      body:=concat('{"triggered_at": "', now(), '", "trigger": "cron-morning"}')::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'auto-generate-trending-webstories-evening',
  '30 12 * * *', -- 6:00 PM IST
  $$
  SELECT
    net.http_post(
      url:='https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-generate-trending-webstories',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU"}'::jsonb,
      body:=concat('{"triggered_at": "', now(), '", "trigger": "cron-evening"}')::jsonb
    ) as request_id;
  $$
);

-- Create cron job to auto-publish web stories every 30 minutes
SELECT cron.schedule(
  'auto-publish-web-stories',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
      url:='https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-publish-web-story',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU"}'::jsonb,
      body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- View all scheduled cron jobs related to web stories
SELECT jobid, jobname, schedule, active, nodename 
FROM cron.job 
WHERE jobname LIKE '%webstories%' OR jobname LIKE '%web-story%' OR jobname LIKE '%web_story%'
ORDER BY jobname;