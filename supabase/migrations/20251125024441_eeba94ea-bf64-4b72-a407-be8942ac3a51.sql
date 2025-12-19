-- Add automation columns to web_stories table
ALTER TABLE web_stories 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS generation_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS ai_confidence_score FLOAT,
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source_article_id UUID REFERENCES articles(id);

-- Create web stories queue table
CREATE TABLE IF NOT EXISTS web_stories_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES web_stories(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 0,
  auto_publish BOOLEAN DEFAULT false,
  review_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_stories_scheduled 
ON web_stories(scheduled_publish_at) 
WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_queue_pending 
ON web_stories_queue(scheduled_at) 
WHERE review_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_queue_story 
ON web_stories_queue(story_id);

-- Enable RLS on queue table
ALTER TABLE web_stories_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for queue
CREATE POLICY "Admins can manage queue"
ON web_stories_queue
FOR ALL
USING (get_current_user_role() = 'admin');

CREATE POLICY "Queue viewable by admins"
ON web_stories_queue
FOR SELECT
USING (get_current_user_role() = 'admin');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_web_stories_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_queue_timestamp
BEFORE UPDATE ON web_stories_queue
FOR EACH ROW
EXECUTE FUNCTION update_web_stories_queue_updated_at();