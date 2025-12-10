-- Auto-Generate Articles Cron Jobs Setup
-- Run this SQL in Supabase SQL Editor to enable autonomous article generation

-- Enable required extensions (skip if already enabled)
do $$ 
begin
  create extension if not exists pg_cron with schema extensions;
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'Extensions already enabled, continuing...';
end $$;

-- Cron Job 1: Generate 3 breaking news articles ONCE daily at 8:00 AM IST
-- Runs once per day to generate exactly 3 high-trending news articles
select cron.schedule(
  'auto-generate-breaking-news-daily',
  '30 2 * * *', -- 8:00 AM IST (2:30 AM UTC)
  $$
  select
    net.http_post(
      url:='https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-generate-articles',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU"}'::jsonb,
      body:=concat('{"count": 3, "trigger": "cron-daily-news", "triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Cron Job 2: Publish scheduled articles every 10 minutes (faster for breaking news)
select cron.schedule(
  'publish-scheduled-articles',
  '*/10 * * * *', -- Every 10 minutes
  $$
  select
    net.http_post(
      url:='https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/publish-scheduled-articles',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU"}'::jsonb,
      body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- View all scheduled cron jobs
select * from cron.job where jobname like '%article%' or jobname like '%webstories%';

-- To manually unschedule jobs if needed:
-- select cron.unschedule('auto-generate-breaking-news-daily');
-- select cron.unschedule('publish-scheduled-articles');
-- select cron.unschedule('auto-generate-webstories-daily');
