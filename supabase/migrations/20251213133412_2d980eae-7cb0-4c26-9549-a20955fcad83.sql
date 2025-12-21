-- Disable ALL automatic web story generation and publishing cron jobs

-- Remove auto-generate-trending-webstories-morning (Job ID 5)
SELECT cron.unschedule(5);

-- Remove auto-generate-trending-webstories-evening (Job ID 6)
SELECT cron.unschedule(6);

-- Remove auto-generate-webstories (Job ID 16)
SELECT cron.unschedule(16);

-- Remove auto-publish-web-stories (Job ID 7)
SELECT cron.unschedule(7);

-- Remove auto-publish-webstories (Job ID 2)
SELECT cron.unschedule(2);