-- Fix search_path for functions to prevent security issues
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION increment_job_applies(job_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.private_jobs
  SET applies_count = applies_count + 1
  WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION increment_job_views(job_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.private_jobs
  SET views_count = views_count + 1
  WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;