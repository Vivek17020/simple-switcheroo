-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the trending web stories automation to run every 6 hours
SELECT cron.schedule(
  'auto-generate-trending-webstories',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-generate-trending-webstories',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule the auto-publish job to run every hour
SELECT cron.schedule(
  'auto-publish-webstories',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://tadcyglvsjycpgsjkywj.supabase.co/functions/v1/auto-publish-web-story',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGN5Z2x2c2p5Y3Bnc2preXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxODM5MjcsImV4cCI6MjA3MTc1OTkyN30.iWxyE6ZuhknVbggP5Q7_jdj5-6C14RMOeLvcZ5erpSU"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Add metadata columns to web_stories for automation tracking
ALTER TABLE web_stories 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS generation_source TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS source_article_id UUID REFERENCES articles(id);

-- Create index for auto-generated stories cleanup
CREATE INDEX IF NOT EXISTS idx_web_stories_auto_generated_created 
ON web_stories(auto_generated, created_at) 
WHERE auto_generated = true;