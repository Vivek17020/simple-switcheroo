-- Note: If you get extension errors, extensions might already be enabled
-- In that case, just run the cron.schedule commands below

-- Try to enable extensions (skip if already enabled)
do $$ 
begin
  create extension if not exists pg_cron with schema extensions;
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'Extensions already enabled, continuing...';
end $$;

-- Create cron job to auto-generate web stories from the 3 daily news articles
-- Runs at 12:00 PM IST (6:30 AM UTC) - 4 hours after articles are generated and published
select cron.schedule(
  'auto-generate-webstories-daily',
  '30 6 * * *', -- 12:00 PM IST (after articles are published)
  $$
  select
    net.http_post(
      url:='https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-generate-trending-webstories',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU"}'::jsonb,
      body:=concat('{"triggered_at": "', now(), '", "trigger": "cron-daily", "count": 3}')::jsonb
    ) as request_id;
  $$
);

-- View scheduled cron jobs
select * from cron.job where jobname like '%webstories%';
