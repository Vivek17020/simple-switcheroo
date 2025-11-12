-- Add shares tracking table
CREATE TABLE public.article_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL,
  platform text NOT NULL, -- 'twitter', 'facebook', 'linkedin', 'whatsapp', 'copy'
  user_id uuid,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.article_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for shares
CREATE POLICY "Anyone can share articles" 
ON public.article_shares 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view article shares" 
ON public.article_shares 
FOR SELECT 
USING (true);

-- Add shares_count column to articles
ALTER TABLE public.articles 
ADD COLUMN shares_count integer DEFAULT 0;

-- Create function to update shares count
CREATE OR REPLACE FUNCTION public.update_article_shares_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles 
    SET shares_count = shares_count + 1 
    WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles 
    SET shares_count = shares_count - 1 
    WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$

-- Create trigger for shares count
CREATE TRIGGER update_article_shares_count_trigger
  AFTER INSERT OR DELETE ON public.article_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_article_shares_count();

-- Add comments_count column to articles
ALTER TABLE public.articles 
ADD COLUMN comments_count integer DEFAULT 0;

-- Create function to update comments count
CREATE OR REPLACE FUNCTION public.update_article_comments_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$

-- Create trigger for comments count
CREATE TRIGGER update_article_comments_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_article_comments_count();

-- Create function to calculate trending score
CREATE OR REPLACE FUNCTION public.calculate_trending_score(
  likes integer,
  shares integer,
  views integer,
  comments integer,
  published_at timestamp with time zone
)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  engagement_score numeric;
  time_decay numeric;
  hours_since_published numeric;
BEGIN
  -- Calculate base engagement score
  engagement_score := (likes * 3) + (shares * 5) + (views * 1) + (comments * 7);
  
  -- Calculate time decay (newer articles get higher scores)
  hours_since_published := EXTRACT(EPOCH FROM (now() - published_at)) / 3600;
  time_decay := CASE 
    WHEN hours_since_published <= 24 THEN 1.0
    WHEN hours_since_published <= 72 THEN 0.8
    WHEN hours_since_published <= 168 THEN 0.6
    ELSE 0.4
  END;
  
  RETURN engagement_score * time_decay;
END;
$function$