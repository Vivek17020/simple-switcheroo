-- Create exam_list table
CREATE TABLE IF NOT EXISTS public.exam_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name TEXT NOT NULL,
  category TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  short_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on exam_list
ALTER TABLE public.exam_list ENABLE ROW LEVEL SECURITY;

-- Policies for exam_list (public read, admin write)
CREATE POLICY "exam_list_public_read" ON public.exam_list
  FOR SELECT USING (true);

CREATE POLICY "exam_list_admin_write" ON public.exam_list
  FOR ALL USING (is_admin());

-- Add exam_id to exam_papers and modify structure
ALTER TABLE public.exam_papers 
  ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES public.exam_list(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tier TEXT,
  DROP COLUMN IF EXISTS exam_name,
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS subject,
  DROP COLUMN IF EXISTS category;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_exam_papers_exam_id ON public.exam_papers(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_list_slug ON public.exam_list(slug);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_exam_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_list_updated_at
  BEFORE UPDATE ON public.exam_list
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_list_updated_at();