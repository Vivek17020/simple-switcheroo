-- Create UPSC Quizzes table
CREATE TABLE public.upsc_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  total_marks INTEGER NOT NULL DEFAULT 10,
  negative_marking NUMERIC NOT NULL DEFAULT 0.33,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  is_daily_quiz BOOLEAN DEFAULT false,
  quiz_date DATE,
  attempt_count INTEGER DEFAULT 0,
  avg_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create UPSC Quiz Attempts table
CREATE TABLE public.upsc_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.upsc_quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  total_questions INTEGER NOT NULL DEFAULT 0,
  attempted INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  incorrect INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  score NUMERIC NOT NULL DEFAULT 0,
  max_score NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upsc_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for upsc_quizzes
CREATE POLICY "Published quizzes viewable by everyone" 
  ON public.upsc_quizzes FOR SELECT 
  USING (is_published = true OR get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage quizzes" 
  ON public.upsc_quizzes FOR ALL 
  USING (get_current_user_role() = 'admin');

-- Policies for upsc_quiz_attempts
CREATE POLICY "Users can view own attempts" 
  ON public.upsc_quiz_attempts FOR SELECT 
  USING (auth.uid() = user_id OR get_current_user_role() = 'admin');

CREATE POLICY "Users can insert own attempts" 
  ON public.upsc_quiz_attempts FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own attempts" 
  ON public.upsc_quiz_attempts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all attempts" 
  ON public.upsc_quiz_attempts FOR ALL 
  USING (get_current_user_role() = 'admin');

-- Create indexes
CREATE INDEX idx_upsc_quizzes_category ON public.upsc_quizzes(category);
CREATE INDEX idx_upsc_quizzes_published ON public.upsc_quizzes(is_published);
CREATE INDEX idx_upsc_quizzes_daily ON public.upsc_quizzes(is_daily_quiz, quiz_date);
CREATE INDEX idx_upsc_quiz_attempts_user ON public.upsc_quiz_attempts(user_id);
CREATE INDEX idx_upsc_quiz_attempts_quiz ON public.upsc_quiz_attempts(quiz_id);

-- Trigger for updated_at
CREATE TRIGGER update_upsc_quizzes_updated_at
  BEFORE UPDATE ON public.upsc_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample quiz for testing
INSERT INTO public.upsc_quizzes (title, description, category, subject, difficulty, duration_minutes, total_marks, negative_marking, is_published, questions) VALUES
('Daily Current Affairs Quiz', 'Test your knowledge of recent current affairs for UPSC preparation', 'current-affairs', 'General Studies', 'medium', 10, 10, 0.33, true, '[
  {
    "id": "q1",
    "question": "Which country recently launched the ''Green Hydrogen Mission'' to become a global hub for green hydrogen production?",
    "options": ["China", "India", "Germany", "Japan"],
    "correct_answer": 1,
    "explanation": "India launched the National Green Hydrogen Mission in January 2023 with an outlay of ₹19,744 crore to make India a global hub for production, usage and export of Green Hydrogen.",
    "topic": "Economy"
  },
  {
    "id": "q2", 
    "question": "The Monetary Policy Committee (MPC) in India is headed by:",
    "options": ["Finance Minister", "RBI Governor", "Chief Economic Advisor", "Finance Secretary"],
    "correct_answer": 1,
    "explanation": "The MPC is headed by the RBI Governor. It is a 6-member committee responsible for fixing the benchmark interest rate in India.",
    "topic": "Economy"
  },
  {
    "id": "q3",
    "question": "Which Article of the Indian Constitution deals with the Right to Education?",
    "options": ["Article 19", "Article 21", "Article 21A", "Article 45"],
    "correct_answer": 2,
    "explanation": "Article 21A was inserted by the 86th Constitutional Amendment Act, 2002 making education a fundamental right for children aged 6-14 years.",
    "topic": "Polity"
  },
  {
    "id": "q4",
    "question": "The ''Agnipath Scheme'' is related to:",
    "options": ["Agricultural reforms", "Military recruitment", "Education sector", "Healthcare"],
    "correct_answer": 1,
    "explanation": "Agnipath is a recruitment scheme for Indian youth to serve in the Armed Forces. Recruits are called Agniveers and serve for 4 years.",
    "topic": "Defence"
  },
  {
    "id": "q5",
    "question": "Which of the following is NOT a Fundamental Duty under Article 51A?",
    "options": ["To protect sovereignty and integrity of India", "To pay taxes", "To protect natural environment", "To develop scientific temper"],
    "correct_answer": 1,
    "explanation": "Paying taxes is not listed under Fundamental Duties in Article 51A. It is a legal obligation but not a Fundamental Duty.",
    "topic": "Polity"
  },
  {
    "id": "q6",
    "question": "The headquarters of the International Solar Alliance (ISA) is located in:",
    "options": ["New York", "Geneva", "Gurugram", "Paris"],
    "correct_answer": 2,
    "explanation": "The ISA headquarters is located in Gurugram, India. It was jointly launched by India and France in 2015 during COP21.",
    "topic": "Environment"
  },
  {
    "id": "q7",
    "question": "Which Schedule of the Constitution contains provisions for anti-defection law?",
    "options": ["Eighth Schedule", "Ninth Schedule", "Tenth Schedule", "Eleventh Schedule"],
    "correct_answer": 2,
    "explanation": "The Tenth Schedule contains the anti-defection law, added by the 52nd Amendment Act, 1985.",
    "topic": "Polity"
  },
  {
    "id": "q8",
    "question": "Project Tiger was launched in which year?",
    "options": ["1970", "1973", "1976", "1980"],
    "correct_answer": 1,
    "explanation": "Project Tiger was launched on April 1, 1973 by the Government of India to protect the Bengal tiger. Jim Corbett National Park was one of the first 9 tiger reserves.",
    "topic": "Environment"
  },
  {
    "id": "q9",
    "question": "The concept of ''Basic Structure'' of the Constitution was propounded in which case?",
    "options": ["Golaknath Case", "Kesavananda Bharati Case", "Minerva Mills Case", "Maneka Gandhi Case"],
    "correct_answer": 1,
    "explanation": "The Basic Structure doctrine was propounded in Kesavananda Bharati v. State of Kerala (1973). It limits Parliament''s power to amend the Constitution.",
    "topic": "Polity"
  },
  {
    "id": "q10",
    "question": "Which is the highest civilian award in India?",
    "options": ["Padma Vibhushan", "Padma Bhushan", "Bharat Ratna", "Param Vir Chakra"],
    "correct_answer": 2,
    "explanation": "Bharat Ratna is the highest civilian award in India, instituted in 1954. It is awarded for exceptional service towards advancement of art, literature, science, and public services.",
    "topic": "General Knowledge"
  }
]'::jsonb),
('Indian Polity - Constitution Basics', 'Test your understanding of Indian Constitution fundamentals', 'prelims', 'Indian Polity', 'easy', 15, 10, 0.33, true, '[
  {
    "id": "p1",
    "question": "The Constitution of India was adopted on:",
    "options": ["January 26, 1950", "November 26, 1949", "August 15, 1947", "January 26, 1949"],
    "correct_answer": 1,
    "explanation": "The Constitution was adopted on November 26, 1949 by the Constituent Assembly. It came into effect on January 26, 1950.",
    "topic": "Constitution"
  },
  {
    "id": "p2",
    "question": "Who is known as the Father of the Indian Constitution?",
    "options": ["Jawaharlal Nehru", "Mahatma Gandhi", "B.R. Ambedkar", "Sardar Patel"],
    "correct_answer": 2,
    "explanation": "Dr. B.R. Ambedkar, as the Chairman of the Drafting Committee, is known as the Father of the Indian Constitution.",
    "topic": "Constitution"
  },
  {
    "id": "p3",
    "question": "How many Fundamental Rights were originally provided in the Constitution?",
    "options": ["5", "6", "7", "8"],
    "correct_answer": 2,
    "explanation": "Originally there were 7 Fundamental Rights. Right to Property was removed by the 44th Amendment Act, 1978, leaving 6 Fundamental Rights.",
    "topic": "Fundamental Rights"
  },
  {
    "id": "p4",
    "question": "The Preamble of the Indian Constitution declares India as:",
    "options": ["Sovereign Democratic Republic", "Sovereign Socialist Secular Democratic Republic", "Socialist Secular Republic", "Federal Democratic Republic"],
    "correct_answer": 1,
    "explanation": "The Preamble declares India as a ''Sovereign Socialist Secular Democratic Republic''. Socialist and Secular were added by the 42nd Amendment, 1976.",
    "topic": "Preamble"
  },
  {
    "id": "p5",
    "question": "Which Part of the Constitution deals with Fundamental Rights?",
    "options": ["Part II", "Part III", "Part IV", "Part V"],
    "correct_answer": 1,
    "explanation": "Part III (Articles 12-35) of the Constitution deals with Fundamental Rights.",
    "topic": "Fundamental Rights"
  }
]'::jsonb);