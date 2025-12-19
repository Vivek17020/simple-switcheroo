-- Create table for web story image cache
CREATE TABLE IF NOT EXISTS public.web_story_image_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.web_story_image_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.web_story_image_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index on prompt_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_web_story_image_cache_prompt_hash 
  ON public.web_story_image_cache(prompt_hash);

-- Create index on last_used_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_web_story_image_cache_last_used 
  ON public.web_story_image_cache(last_used_at DESC);