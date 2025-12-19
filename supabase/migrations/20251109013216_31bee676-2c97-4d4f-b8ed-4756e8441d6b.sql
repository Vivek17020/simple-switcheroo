-- Add category column to homepage_videos table
ALTER TABLE public.homepage_videos
ADD COLUMN category text NOT NULL DEFAULT 'all';

-- Add index for better query performance
CREATE INDEX idx_homepage_videos_category ON public.homepage_videos(category);

-- Update existing videos to have 'all' category
UPDATE public.homepage_videos SET category = 'all' WHERE category IS NULL;