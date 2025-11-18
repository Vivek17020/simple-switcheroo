-- Create user reading history table
CREATE TABLE public.user_reading_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  ip_address TEXT,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reading_duration INTEGER DEFAULT 0, -- in seconds
  read_percentage INTEGER DEFAULT 0, -- 0-100%
  UNIQUE(user_id, article_id, date_trunc('day', read_at))
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  preferred_categories UUID[] DEFAULT '{}',
  preferred_tags TEXT[] DEFAULT '{}',
  reading_frequency JSONB DEFAULT '{}', -- {category_id: count}
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(ip_address)
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

-- Function to update user preferences based on reading history
CREATE OR REPLACE FUNCTION public.update_user_preferences()
RETURNS TRIGGER AS $$
DECLARE
  category_counts JSONB;
  top_categories UUID[];
  recent_tags TEXT[];
BEGIN
  -- Update reading frequency for categories
  SELECT COALESCE(
    jsonb_object_agg(
      a.category_id::text, 
      COALESCE((up.reading_frequency->>a.category_id::text)::integer, 0) + 1
    ), 
    '{}'::jsonb
  ) INTO category_counts
  FROM public.articles a
  LEFT JOIN public.user_preferences up ON up.user_id = NEW.user_id
  WHERE a.id = NEW.article_id;

  -- Get top 5 most read categories
  SELECT ARRAY(
    SELECT (jsonb_each(category_counts)).key::UUID
    FROM jsonb_each(category_counts)
    ORDER BY (jsonb_each(category_counts)).value::integer DESC
    LIMIT 5
  ) INTO top_categories;

  -- Get recent tags from read articles
  SELECT ARRAY(
    SELECT DISTINCT unnest(a.tags)
    FROM public.articles a
    JOIN public.user_reading_history urh ON urh.article_id = a.id
    WHERE urh.user_id = NEW.user_id 
    AND urh.read_at >= NOW() - INTERVAL '30 days'
    AND a.tags IS NOT NULL
    LIMIT 20
  ) INTO recent_tags;

  -- Insert or update user preferences
  INSERT INTO public.user_preferences (
    user_id, 
    ip_address,
    preferred_categories, 
    preferred_tags, 
    reading_frequency
  ) VALUES (
    NEW.user_id,
    NEW.ip_address,
    top_categories,
    recent_tags,
    category_counts
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    preferred_categories = top_categories,
    preferred_tags = recent_tags,
    reading_frequency = category_counts,
    last_updated = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update preferences when reading history is added
CREATE TRIGGER update_preferences_on_read
  AFTER INSERT ON public.user_reading_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_preferences();

-- Function to calculate personalized article scores
CREATE OR REPLACE FUNCTION public.calculate_personalized_score(
  article_id_param UUID,
  user_id_param UUID DEFAULT NULL,
  ip_address_param TEXT DEFAULT NULL
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  base_score DECIMAL(10,2) := 0;
  relevance_boost DECIMAL(10,2) := 0;
  freshness_multiplier DECIMAL(10,2) := 1;
  user_prefs RECORD;
  article_rec RECORD;
  hours_old INTEGER;
BEGIN
  -- Get article details
  SELECT 
    a.category_id, 
    a.tags, 
    a.likes_count, 
    a.shares_count, 
    a.comments_count, 
    a.views_count,
    a.published_at
  INTO article_rec
  FROM public.articles a 
  WHERE a.id = article_id_param;

  -- Base engagement score
  base_score := (
    COALESCE(article_rec.likes_count, 0) * 3 +
    COALESCE(article_rec.shares_count, 0) * 5 +
    COALESCE(article_rec.comments_count, 0) * 7 +
    COALESCE(article_rec.views_count, 0) * 1
  );

  -- Calculate freshness multiplier
  hours_old := EXTRACT(EPOCH FROM (NOW() - article_rec.published_at)) / 3600;
  freshness_multiplier := CASE
    WHEN hours_old <= 6 THEN 2.0
    WHEN hours_old <= 24 THEN 1.5
    WHEN hours_old <= 72 THEN 1.2
    WHEN hours_old <= 168 THEN 1.0
    ELSE 0.8
  END;

  -- Get user preferences if available
  IF user_id_param IS NOT NULL THEN
    SELECT * INTO user_prefs 
    FROM public.user_preferences 
    WHERE user_id = user_id_param;
  ELSIF ip_address_param IS NOT NULL THEN
    SELECT * INTO user_prefs 
    FROM public.user_preferences 
    WHERE ip_address = ip_address_param;
  END IF;

  -- Add relevance boost based on user preferences
  IF user_prefs IS NOT NULL THEN
    -- Category preference boost
    IF article_rec.category_id = ANY(user_prefs.preferred_categories) THEN
      relevance_boost := relevance_boost + 50;
    END IF;
    
    -- Tag preference boost
    IF article_rec.tags && user_prefs.preferred_tags THEN
      relevance_boost := relevance_boost + 25;
    END IF;
  END IF;

  RETURN (base_score + relevance_boost) * freshness_multiplier;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;