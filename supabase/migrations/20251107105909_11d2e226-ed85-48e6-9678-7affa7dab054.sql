-- Fix RLS policies for web_stories to handle user_id properly

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create web stories" ON public.web_stories;
DROP POLICY IF EXISTS "Authenticated users can update their own web stories" ON public.web_stories;
DROP POLICY IF EXISTS "Authenticated users can delete their own web stories" ON public.web_stories;

-- Create improved INSERT policy that ensures user_id is set
CREATE POLICY "Authenticated users can create web stories with user_id"
ON public.web_stories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  user_id IS NOT NULL
);

-- Create improved UPDATE policy that handles ownership properly
CREATE POLICY "Users can update their own web stories"
ON public.web_stories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Create improved DELETE policy
CREATE POLICY "Users can delete their own web stories"
ON public.web_stories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Allow admins to manage all web stories
CREATE POLICY "Admins can manage all web stories"
ON public.web_stories
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Clean up orphaned web stories (those with NULL user_id)
DELETE FROM public.web_stories WHERE user_id IS NULL;

-- Add NOT NULL constraint to user_id to prevent future issues
ALTER TABLE public.web_stories 
ALTER COLUMN user_id SET NOT NULL;