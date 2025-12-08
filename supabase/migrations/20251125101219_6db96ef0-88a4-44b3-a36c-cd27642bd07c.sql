-- Allow NULL user_id for auto-generated web stories
ALTER TABLE public.web_stories 
ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure either user_id is provided OR auto_generated is true
ALTER TABLE public.web_stories 
ADD CONSTRAINT web_stories_user_or_auto_check 
CHECK (user_id IS NOT NULL OR auto_generated = true);

-- Add comment explaining the change
COMMENT ON COLUMN public.web_stories.user_id IS 
'User ID of the story creator. Can be NULL for auto-generated stories.';