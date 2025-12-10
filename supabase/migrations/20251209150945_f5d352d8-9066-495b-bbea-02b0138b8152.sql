-- Create UPSC Flashcards table
CREATE TABLE public.upsc_flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  front_content TEXT NOT NULL,
  back_content TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create UPSC Notes table
CREATE TABLE public.upsc_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  topic TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  download_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create UPSC User Progress table (tracks article completion)
CREATE TABLE public.upsc_user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Create UPSC Bookmarks table
CREATE TABLE public.upsc_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Create UPSC Flashcard Progress table
CREATE TABLE public.upsc_flashcard_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flashcard_id UUID NOT NULL REFERENCES public.upsc_flashcards(id) ON DELETE CASCADE,
  last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  mastery_level INTEGER DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 5),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

-- Enable RLS on all tables
ALTER TABLE public.upsc_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_flashcard_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for upsc_flashcards
CREATE POLICY "Published flashcards viewable by everyone" ON public.upsc_flashcards
  FOR SELECT USING (is_published = true OR is_admin());

CREATE POLICY "Admins can manage flashcards" ON public.upsc_flashcards
  FOR ALL USING (is_admin());

-- RLS Policies for upsc_notes
CREATE POLICY "Published notes viewable by everyone" ON public.upsc_notes
  FOR SELECT USING (is_published = true OR is_admin());

CREATE POLICY "Admins can manage notes" ON public.upsc_notes
  FOR ALL USING (is_admin());

-- RLS Policies for upsc_user_progress
CREATE POLICY "Users can view own progress" ON public.upsc_user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.upsc_user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.upsc_user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.upsc_user_progress
  FOR SELECT USING (is_admin());

-- RLS Policies for upsc_bookmarks
CREATE POLICY "Users can manage own bookmarks" ON public.upsc_bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookmarks" ON public.upsc_bookmarks
  FOR SELECT USING (is_admin());

-- RLS Policies for upsc_flashcard_progress
CREATE POLICY "Users can manage own flashcard progress" ON public.upsc_flashcard_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all flashcard progress" ON public.upsc_flashcard_progress
  FOR SELECT USING (is_admin());

-- Create updated_at triggers
CREATE TRIGGER update_upsc_flashcards_updated_at
  BEFORE UPDATE ON public.upsc_flashcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_upsc_notes_updated_at
  BEFORE UPDATE ON public.upsc_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_upsc_flashcard_progress_updated_at
  BEFORE UPDATE ON public.upsc_flashcard_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment note download count
CREATE OR REPLACE FUNCTION public.increment_note_download_count(note_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.upsc_notes
  SET download_count = download_count + 1
  WHERE id = note_uuid;
END;
$$;