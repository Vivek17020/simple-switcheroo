-- Create UPSC PYQ Questions table
CREATE TABLE public.upsc_pyq_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  section_title TEXT NOT NULL DEFAULT 'General',
  question_number INTEGER NOT NULL DEFAULT 1,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'assertion_reason', 'match_list', 'chronological', 'passage_based')),
  question_text TEXT NOT NULL,
  passage TEXT,
  options JSONB NOT NULL DEFAULT '{"a": "", "b": "", "c": "", "d": ""}',
  correct_answer TEXT CHECK (correct_answer IN ('a', 'b', 'c', 'd', 'unknown')),
  explanation TEXT,
  additional_media JSONB DEFAULT '{"image_urls": [], "tables": []}',
  year INTEGER,
  exam_name TEXT DEFAULT 'UPSC CSE Prelims',
  subject TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create UPSC PYQ Attempts table for tracking user progress
CREATE TABLE public.upsc_pyq_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.upsc_pyq_questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER DEFAULT 0,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE public.upsc_pyq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_pyq_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for upsc_pyq_questions
CREATE POLICY "Published PYQ questions viewable by everyone"
ON public.upsc_pyq_questions FOR SELECT
USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage PYQ questions"
ON public.upsc_pyq_questions FOR ALL
USING (auth.role() = 'authenticated');

-- RLS Policies for upsc_pyq_attempts
CREATE POLICY "Users can view own attempts"
ON public.upsc_pyq_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
ON public.upsc_pyq_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
ON public.upsc_pyq_attempts FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_upsc_pyq_questions_article ON public.upsc_pyq_questions(article_id);
CREATE INDEX idx_upsc_pyq_questions_exam ON public.upsc_pyq_questions(exam_name, year);
CREATE INDEX idx_upsc_pyq_questions_subject ON public.upsc_pyq_questions(subject, topic);
CREATE INDEX idx_upsc_pyq_attempts_user ON public.upsc_pyq_attempts(user_id);
CREATE INDEX idx_upsc_pyq_attempts_question ON public.upsc_pyq_attempts(question_id);

-- Trigger for updated_at
CREATE TRIGGER update_upsc_pyq_questions_updated_at
BEFORE UPDATE ON public.upsc_pyq_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();