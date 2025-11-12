-- Add shares_count and comments_count columns to articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Create function to update shares count
CREATE OR REPLACE FUNCTION public.update_article_shares_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for shares count
DROP TRIGGER IF EXISTS update_article_shares_count_trigger ON public.article_shares;
CREATE TRIGGER update_article_shares_count_trigger
  AFTER INSERT OR DELETE ON public.article_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_article_shares_count();

-- Create function to update comments count
CREATE OR REPLACE FUNCTION public.update_article_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for comments count
DROP TRIGGER IF EXISTS update_article_comments_count_trigger ON public.comments;
CREATE TRIGGER update_article_comments_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_article_comments_count();