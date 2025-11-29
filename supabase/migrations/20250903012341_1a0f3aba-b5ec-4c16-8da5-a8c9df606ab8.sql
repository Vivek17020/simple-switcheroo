-- Create user reading history table
CREATE TABLE public.user_reading_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  ip_address TEXT,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reading_duration INTEGER DEFAULT 0, -- in seconds
  read_percentage INTEGER DEFAULT 0 -- 0-100%
);

-- Create unique constraint separately
CREATE UNIQUE INDEX user_article_daily_read ON public.user_reading_history (
  user_id, 
  article_id, 
  date_trunc('day', read_at)
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  ip_address TEXT UNIQUE,
  preferred_categories UUID[] DEFAULT '{}',
  preferred_tags TEXT[] DEFAULT '{}',
  reading_frequency JSONB DEFAULT '{}', -- {category_id: count}
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily trending scores table
CREATE TABLE public.daily_trending_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trending_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  engagement_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  freshness_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  UNIQUE(article_id, score_date)
);

-- Enable RLS
ALTER TABLE public.user_reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_trending_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reading_history
CREATE POLICY "Users can view their own reading history" 
ON public.user_reading_history 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own reading history" 
ON public.user_reading_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all reading history" 
ON public.user_reading_history 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all preferences" 
ON public.user_preferences 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- RLS Policies for daily_trending_scores
CREATE POLICY "Everyone can view trending scores" 
ON public.daily_trending_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage trending scores" 
ON public.daily_trending_scores 
FOR ALL 
USING (get_current_user_role() = 'admin');