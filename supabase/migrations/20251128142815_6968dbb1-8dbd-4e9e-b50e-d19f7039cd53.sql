-- Create function to increment image cache usage
CREATE OR REPLACE FUNCTION public.increment_image_cache_usage(cache_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.web_story_image_cache
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = cache_id;
END;
$$;