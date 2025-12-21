-- Create videos table for homepage videos
CREATE TABLE public.homepage_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Videos viewable by everyone" 
ON public.homepage_videos 
FOR SELECT 
USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage videos" 
ON public.homepage_videos 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create trigger for timestamps
CREATE TRIGGER update_homepage_videos_updated_at
BEFORE UPDATE ON public.homepage_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();