-- Add article linking and auto-generation fields to upsc_flashcards
ALTER TABLE public.upsc_flashcards 
ADD COLUMN IF NOT EXISTS article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS generated_by text DEFAULT 'manual' CHECK (generated_by IN ('manual', 'ai')),
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'custom' CHECK (source_type IN ('article', 'pyq', 'custom'));

-- Create index for faster article lookups
CREATE INDEX IF NOT EXISTS idx_upsc_flashcards_article_id ON public.upsc_flashcards(article_id);

-- Create upsc_article_notes table for human-readable notes (not PDFs)
CREATE TABLE IF NOT EXISTS public.upsc_article_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL,
  topic text,
  
  -- Structured note content (student-friendly)
  key_points text[] DEFAULT '{}',
  summary text,
  mnemonics text[] DEFAULT '{}',
  important_terms jsonb DEFAULT '[]',
  exam_tips text[] DEFAULT '{}',
  related_topics text[] DEFAULT '{}',
  
  -- Metadata
  word_count integer DEFAULT 0,
  reading_time integer DEFAULT 5,
  generated_by text DEFAULT 'manual' CHECK (generated_by IN ('manual', 'ai')),
  is_published boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one note per article
  CONSTRAINT unique_article_note UNIQUE (article_id)
);

-- Enable RLS
ALTER TABLE public.upsc_article_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for upsc_article_notes
CREATE POLICY "Public can view published article notes"
ON public.upsc_article_notes
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage article notes"
ON public.upsc_article_notes
FOR ALL
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_upsc_article_notes_updated_at
BEFORE UPDATE ON public.upsc_article_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_upsc_article_notes_article_id ON public.upsc_article_notes(article_id);
CREATE INDEX IF NOT EXISTS idx_upsc_article_notes_subject ON public.upsc_article_notes(subject);