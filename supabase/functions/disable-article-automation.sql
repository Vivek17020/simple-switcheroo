-- Disable Article Automation
-- Run this SQL in Supabase SQL Editor to stop automatic article generation

-- Unschedule the article generation cron job
SELECT cron.unschedule('auto-generate-breaking-news-daily');

-- Unschedule the article publishing cron job
SELECT cron.unschedule('publish-scheduled-articles');

-- Verify cron jobs are removed
SELECT * FROM cron.job WHERE jobname LIKE '%article%';
