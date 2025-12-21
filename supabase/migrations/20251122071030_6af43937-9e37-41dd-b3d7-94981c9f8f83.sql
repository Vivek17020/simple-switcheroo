-- Create private_jobs table with all required fields
CREATE TABLE IF NOT EXISTS public.private_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  company text NOT NULL,
  logo text,
  location text NOT NULL,
  salary text NOT NULL,
  experience text NOT NULL,
  job_type text NOT NULL,
  description text NOT NULL,
  short_description text NOT NULL,
  tags text[] DEFAULT '{}',
  apply_url text NOT NULL,
  source text DEFAULT 'direct',
  posted_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_new boolean DEFAULT true,
  is_published boolean DEFAULT false,
  recommended_score numeric DEFAULT 0,
  views_count integer DEFAULT 0,
  applies_count integer DEFAULT 0,
  author_id uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_experience CHECK (experience IN ('Fresher', '0-1', '1-3', '3-5', '5+', 'Any')),
  CONSTRAINT valid_job_type CHECK (job_type IN ('Full-time', 'Part-time', 'Internship', 'Remote', 'Contract', 'Freelance')),
  CONSTRAINT valid_recommended_score CHECK (recommended_score >= 0 AND recommended_score <= 1)
);

-- Create index for faster queries
CREATE INDEX idx_private_jobs_published ON public.private_jobs(is_published, posted_at DESC);
CREATE INDEX idx_private_jobs_slug ON public.private_jobs(slug);
CREATE INDEX idx_private_jobs_company ON public.private_jobs(company);
CREATE INDEX idx_private_jobs_location ON public.private_jobs(location);
CREATE INDEX idx_private_jobs_experience ON public.private_jobs(experience);
CREATE INDEX idx_private_jobs_job_type ON public.private_jobs(job_type);
CREATE INDEX idx_private_jobs_recommended ON public.private_jobs(recommended_score DESC) WHERE is_published = true;

-- Enable RLS
ALTER TABLE public.private_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view published jobs
CREATE POLICY "Published jobs viewable by everyone"
ON public.private_jobs
FOR SELECT
USING (is_published = true);

-- Authenticated users (admin) can manage all jobs
CREATE POLICY "Authenticated users can manage jobs"
ON public.private_jobs
FOR ALL
USING (auth.role() = 'authenticated');

-- Create saved_jobs table for users to save jobs
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.private_jobs(id) ON DELETE CASCADE,
  saved_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS on saved_jobs
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own saved jobs
CREATE POLICY "Users can manage their own saved jobs"
ON public.saved_jobs
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_private_jobs_updated_at
BEFORE UPDATE ON public.private_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to increment applies count
CREATE OR REPLACE FUNCTION increment_job_applies(job_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.private_jobs
  SET applies_count = applies_count + 1
  WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment views count
CREATE OR REPLACE FUNCTION increment_job_views(job_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.private_jobs
  SET views_count = views_count + 1
  WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;