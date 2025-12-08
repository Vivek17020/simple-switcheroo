-- Create web_stories_queue table for scheduled publishing
CREATE TABLE IF NOT EXISTS public.web_stories_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.web_stories(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  auto_publish BOOLEAN DEFAULT true,
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  priority INTEGER DEFAULT 50,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web_stories_queue ENABLE ROW LEVEL SECURITY;

-- Create indexes after table is created
CREATE INDEX IF NOT EXISTS idx_web_stories_queue_scheduled 
  ON public.web_stories_queue(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_web_stories_queue_status 
  ON public.web_stories_queue(review_status, scheduled_at);

-- Admin can manage queue
CREATE POLICY "Admins can manage web stories queue"
  ON public.web_stories_queue
  FOR ALL
  USING (get_current_user_role() = 'admin');

-- System can insert and update queue
CREATE POLICY "System can manage web stories queue"
  ON public.web_stories_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add auto_generated columns to web_stories if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'web_stories' AND column_name = 'auto_generated'
  ) THEN
    ALTER TABLE public.web_stories ADD COLUMN auto_generated BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'web_stories' AND column_name = 'generation_source'
  ) THEN
    ALTER TABLE public.web_stories ADD COLUMN generation_source TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'web_stories' AND column_name = 'ai_confidence_score'
  ) THEN
    ALTER TABLE public.web_stories ADD COLUMN ai_confidence_score NUMERIC;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'web_stories' AND column_name = 'source_article_id'
  ) THEN
    ALTER TABLE public.web_stories ADD COLUMN source_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL;
  END IF;
END $$;