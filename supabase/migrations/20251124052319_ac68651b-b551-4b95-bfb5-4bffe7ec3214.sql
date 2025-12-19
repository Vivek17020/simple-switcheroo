-- Create web3_code_snippets table for storing smart contract code
CREATE TABLE public.web3_code_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT DEFAULT 'solidity',
  is_public BOOLEAN DEFAULT true,
  forked_from UUID REFERENCES public.web3_code_snippets(id) ON DELETE SET NULL,
  fork_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web3_code_snippets ENABLE ROW LEVEL SECURITY;

-- Public snippets are viewable by everyone
CREATE POLICY "Public snippets are viewable by everyone"
ON public.web3_code_snippets
FOR SELECT
USING (is_public = true);

-- Users can view their own snippets
CREATE POLICY "Users can view their own snippets"
ON public.web3_code_snippets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own snippets
CREATE POLICY "Users can create snippets"
ON public.web3_code_snippets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own snippets
CREATE POLICY "Users can update their own snippets"
ON public.web3_code_snippets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own snippets
CREATE POLICY "Users can delete their own snippets"
ON public.web3_code_snippets
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_web3_code_snippets_user_id ON public.web3_code_snippets(user_id);
CREATE INDEX idx_web3_code_snippets_public ON public.web3_code_snippets(is_public) WHERE is_public = true;
CREATE INDEX idx_web3_code_snippets_forked_from ON public.web3_code_snippets(forked_from);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_web3_code_snippets_updated_at
BEFORE UPDATE ON public.web3_code_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment fork count
CREATE OR REPLACE FUNCTION public.increment_snippet_fork_count(snippet_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.web3_code_snippets
  SET fork_count = fork_count + 1
  WHERE id = snippet_uuid;
END;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_snippet_view_count(snippet_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.web3_code_snippets
  SET view_count = view_count + 1
  WHERE id = snippet_uuid;
END;
$$;