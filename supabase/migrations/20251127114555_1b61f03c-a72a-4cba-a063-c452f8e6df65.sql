-- Add missing columns to web_stories_queue
ALTER TABLE public.web_stories_queue 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Make story_id NOT NULL if it's nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'web_stories_queue' 
    AND column_name = 'story_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- First delete any rows with NULL story_id
    DELETE FROM public.web_stories_queue WHERE story_id IS NULL;
    
    -- Then add the NOT NULL constraint
    ALTER TABLE public.web_stories_queue 
    ALTER COLUMN story_id SET NOT NULL;
  END IF;
END $$;