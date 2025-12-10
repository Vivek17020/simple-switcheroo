-- Add likes tracking table
CREATE TABLE public.article_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  user_id UUID,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id),
  UNIQUE(article_id, ip_address)
);

-- Enable RLS
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view article likes" 
ON public.article_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can like articles" 
ON public.article_likes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can unlike their own likes" 
ON public.article_likes 
FOR DELETE 
USING (auth.uid() = user_id OR ip_address = inet_client_addr()::text);

-- Add likes_count to articles table
ALTER TABLE public.articles 
ADD COLUMN likes_count INTEGER DEFAULT 0;

-- Add summary field for Google Discover
ALTER TABLE public.articles 
ADD COLUMN summary TEXT;

-- Add author bio fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN job_title TEXT,
ADD COLUMN author_bio TEXT,
ADD COLUMN author_image_url TEXT;

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_article_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for likes count
CREATE TRIGGER update_article_likes_count_trigger
  AFTER INSERT OR DELETE ON public.article_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_article_likes_count();