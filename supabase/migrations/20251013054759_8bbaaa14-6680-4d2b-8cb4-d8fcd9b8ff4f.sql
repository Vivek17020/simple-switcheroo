-- Add category column to exam_papers table
ALTER TABLE public.exam_papers 
ADD COLUMN IF NOT EXISTS category text;

-- Add index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_exam_papers_category ON public.exam_papers(category);

-- Add index for exam_name for slug-based queries
CREATE INDEX IF NOT EXISTS idx_exam_papers_exam_name ON public.exam_papers(exam_name);