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

-- Add comments_count column to articles
ALTER TABLE public.articles 
ADD COLUMN comments_count integer DEFAULT 0;