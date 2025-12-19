-- Create web3_article_progress table to track completed articles
CREATE TABLE IF NOT EXISTS public.web3_article_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  reading_time INTEGER, -- seconds spent reading
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Create web3_badges table to define available badges
CREATE TABLE IF NOT EXISTS public.web3_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- lucide icon name
  criteria JSONB NOT NULL, -- {type: "articles_completed", count: 5, category: "blockchain-basics"}
  points INTEGER DEFAULT 0,
  category TEXT NOT NULL, -- beginner, intermediate, advanced
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_web3_badges table to track earned badges
CREATE TABLE IF NOT EXISTS public.user_web3_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.web3_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create web3_learning_paths table
CREATE TABLE IF NOT EXISTS public.web3_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- beginner, intermediate, advanced
  duration TEXT, -- e.g., "4-6 weeks"
  steps JSONB NOT NULL, -- [{title: "Step 1", article_ids: [...]}]
  category_ids UUID[] NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_learning_path_progress table
CREATE TABLE IF NOT EXISTS public.user_learning_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  learning_path_id UUID NOT NULL REFERENCES public.web3_learning_paths(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, learning_path_id)
);

-- Enable RLS on all tables
ALTER TABLE public.web3_article_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web3_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_web3_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web3_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_path_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for web3_article_progress
CREATE POLICY "Users can view their own progress"
  ON public.web3_article_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.web3_article_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.web3_article_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.web3_article_progress FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- RLS Policies for web3_badges
CREATE POLICY "Everyone can view badges"
  ON public.web3_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.web3_badges FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- RLS Policies for user_web3_badges
CREATE POLICY "Users can view their own badges"
  ON public.user_web3_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' badges"
  ON public.user_web3_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert badges"
  ON public.user_web3_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for web3_learning_paths
CREATE POLICY "Everyone can view learning paths"
  ON public.web3_learning_paths FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage learning paths"
  ON public.web3_learning_paths FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- RLS Policies for user_learning_path_progress
CREATE POLICY "Users can view their own learning path progress"
  ON public.user_learning_path_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning path progress"
  ON public.user_learning_path_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning path progress"
  ON public.user_learning_path_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_web3_article_progress_user_id ON public.web3_article_progress(user_id);
CREATE INDEX idx_web3_article_progress_article_id ON public.web3_article_progress(article_id);
CREATE INDEX idx_user_web3_badges_user_id ON public.user_web3_badges(user_id);
CREATE INDEX idx_user_learning_path_progress_user_id ON public.user_learning_path_progress(user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_web3_article_progress_updated_at
  BEFORE UPDATE ON public.web3_article_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_web3_learning_paths_updated_at
  BEFORE UPDATE ON public.web3_learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_learning_path_progress_updated_at
  BEFORE UPDATE ON public.user_learning_path_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.web3_badges (name, description, icon, criteria, points, category, color) VALUES
  ('First Steps', 'Complete your first Web3 tutorial', 'Award', '{"type": "articles_completed", "count": 1}', 10, 'beginner', 'blue'),
  ('Blockchain Explorer', 'Complete 5 blockchain basics articles', 'Trophy', '{"type": "articles_completed", "count": 5, "category": "blockchain-basics"}', 50, 'beginner', 'purple'),
  ('Smart Contract Novice', 'Complete 5 smart contract tutorials', 'Code', '{"type": "articles_completed", "count": 5, "category": "smart-contracts"}', 50, 'intermediate', 'green'),
  ('DeFi Enthusiast', 'Complete 5 DeFi articles', 'Landmark', '{"type": "articles_completed", "count": 5, "category": "defi"}', 50, 'intermediate', 'yellow'),
  ('NFT Collector', 'Complete 5 NFT tutorials', 'Palette', '{"type": "articles_completed", "count": 5, "category": "nfts"}', 50, 'intermediate', 'pink'),
  ('Crypto Master', 'Complete 10 cryptocurrency articles', 'Coins', '{"type": "articles_completed", "count": 10, "category": "crypto-fundamentals"}', 100, 'advanced', 'orange'),
  ('Web3 Developer', 'Complete 10 Web3 development tutorials', 'FileCode', '{"type": "articles_completed", "count": 10, "category": "web3-development"}', 100, 'advanced', 'red'),
  ('Dedicated Learner', 'Complete 20 Web3 articles', 'Star', '{"type": "articles_completed", "count": 20}', 200, 'advanced', 'gold'),
  ('Speed Reader', 'Complete 3 articles in one day', 'Zap', '{"type": "articles_per_day", "count": 3}', 30, 'beginner', 'cyan'),
  ('Web3 Champion', 'Complete 50 Web3 articles', 'Crown', '{"type": "articles_completed", "count": 50}', 500, 'advanced', 'gold');

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  criteria_type TEXT;
  required_count INTEGER;
  category_filter TEXT;
  user_count INTEGER;
  articles_today INTEGER;
BEGIN
  FOR badge_record IN SELECT * FROM public.web3_badges LOOP
    -- Skip if user already has this badge
    IF EXISTS (
      SELECT 1 FROM public.user_web3_badges 
      WHERE user_id = user_uuid AND badge_id = badge_record.id
    ) THEN
      CONTINUE;
    END IF;

    criteria_type := badge_record.criteria->>'type';
    required_count := (badge_record.criteria->>'count')::INTEGER;
    category_filter := badge_record.criteria->>'category';

    -- Check articles_completed criteria
    IF criteria_type = 'articles_completed' THEN
      IF category_filter IS NOT NULL THEN
        -- Count completed articles in specific category
        SELECT COUNT(DISTINCT wap.article_id) INTO user_count
        FROM public.web3_article_progress wap
        JOIN public.articles a ON wap.article_id = a.id
        JOIN public.categories c ON a.category_id = c.id
        WHERE wap.user_id = user_uuid 
          AND wap.completed = true
          AND c.slug = category_filter;
      ELSE
        -- Count all completed articles
        SELECT COUNT(*) INTO user_count
        FROM public.web3_article_progress
        WHERE user_id = user_uuid AND completed = true;
      END IF;

      IF user_count >= required_count THEN
        INSERT INTO public.user_web3_badges (user_id, badge_id)
        VALUES (user_uuid, badge_record.id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;
    
    -- Check articles_per_day criteria
    ELSIF criteria_type = 'articles_per_day' THEN
      SELECT COUNT(*) INTO articles_today
      FROM public.web3_article_progress
      WHERE user_id = user_uuid 
        AND completed = true
        AND DATE(completed_at) = CURRENT_DATE;

      IF articles_today >= required_count THEN
        INSERT INTO public.user_web3_badges (user_id, badge_id)
        VALUES (user_uuid, badge_record.id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Function to get user progress stats
CREATE OR REPLACE FUNCTION public.get_user_web3_stats(user_uuid UUID)
RETURNS TABLE(
  total_completed INTEGER,
  total_badges INTEGER,
  total_points INTEGER,
  current_streak INTEGER,
  learning_paths_started INTEGER,
  learning_paths_completed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.web3_article_progress WHERE user_id = user_uuid AND completed = true)::INTEGER,
    (SELECT COUNT(*) FROM public.user_web3_badges WHERE user_id = user_uuid)::INTEGER,
    (SELECT COALESCE(SUM(b.points), 0) FROM public.user_web3_badges ub JOIN public.web3_badges b ON ub.badge_id = b.id WHERE ub.user_id = user_uuid)::INTEGER,
    0::INTEGER, -- streak calculation can be added later
    (SELECT COUNT(*) FROM public.user_learning_path_progress WHERE user_id = user_uuid)::INTEGER,
    (SELECT COUNT(*) FROM public.user_learning_path_progress WHERE user_id = user_uuid AND completed_at IS NOT NULL)::INTEGER;
END;
$$;