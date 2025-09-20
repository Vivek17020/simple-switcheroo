-- Add missing columns to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0;

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Create functions and triggers for counting
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
$function$;

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
$function$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_article_shares_count_trigger ON public.article_shares;
DROP TRIGGER IF EXISTS update_article_comments_count_trigger ON public.comments;

-- Create triggers
CREATE TRIGGER update_article_shares_count_trigger
  AFTER INSERT OR DELETE ON public.article_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_article_shares_count();

CREATE TRIGGER update_article_comments_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_article_comments_count();