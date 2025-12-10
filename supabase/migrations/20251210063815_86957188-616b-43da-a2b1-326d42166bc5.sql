-- Streak and gamification system tables

-- Study streaks table
CREATE TABLE public.upsc_study_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Badges definition table
CREATE TABLE public.upsc_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  xp_required INTEGER DEFAULT 0,
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User earned badges
CREATE TABLE public.upsc_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.upsc_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.upsc_study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_user_badges ENABLE ROW LEVEL SECURITY;

-- Streaks policies
CREATE POLICY "Users can view their own streaks"
ON public.upsc_study_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own streaks"
ON public.upsc_study_streaks FOR ALL
USING (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Everyone can view badges"
ON public.upsc_badges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage badges"
ON public.upsc_badges FOR ALL
USING (get_current_user_role() = 'admin');

-- User badges policies
CREATE POLICY "Users can view their own badges"
ON public.upsc_user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert user badges"
ON public.upsc_user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default badges
INSERT INTO public.upsc_badges (name, description, icon, xp_required, criteria) VALUES
('First Steps', 'Complete your first article', 'award', 0, '{"articles_completed": 1}'),
('Week Warrior', '7-day study streak', 'flame', 100, '{"streak_days": 7}'),
('Quiz Master', 'Score 80%+ in 10 quizzes', 'trophy', 200, '{"quizzes_passed": 10}'),
('Polity Pro', 'Complete 20 Polity articles', 'building', 300, '{"category_articles": {"polity": 20}}'),
('Marathon Reader', 'Complete 50 articles', 'book-open', 500, '{"articles_completed": 50}'),
('Centurion', 'Earn 1000 XP', 'star', 1000, '{"xp_earned": 1000}');

-- Function to update streaks
CREATE OR REPLACE FUNCTION public.update_upsc_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_record RECORD;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_record FROM public.upsc_study_streaks WHERE user_id = NEW.user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.upsc_study_streaks (user_id, current_streak, longest_streak, last_activity_date, total_xp)
    VALUES (NEW.user_id, 1, 1, today, 10);
  ELSE
    IF streak_record.last_activity_date = today THEN
      -- Already updated today, just add XP
      UPDATE public.upsc_study_streaks 
      SET total_xp = total_xp + 10, updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF streak_record.last_activity_date = today - INTERVAL '1 day' THEN
      -- Consecutive day - extend streak
      UPDATE public.upsc_study_streaks 
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_activity_date = today,
          total_xp = total_xp + 10,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSE
      -- Streak broken - reset
      UPDATE public.upsc_study_streaks 
      SET current_streak = 1,
          last_activity_date = today,
          total_xp = total_xp + 10,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update streaks on article completion
CREATE TRIGGER update_streak_on_progress
AFTER INSERT ON public.upsc_user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_upsc_streak();