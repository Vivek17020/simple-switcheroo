-- First, let's see what policies exist and fix them properly
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

-- Create proper RLS policies for profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Public can view author info for published articles" 
ON public.profiles 
FOR SELECT 
USING (id IN ( SELECT DISTINCT articles.author_id
   FROM articles
  WHERE ((articles.published = true) AND (articles.author_id IS NOT NULL))));

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Critical: Allow profile creation (both by users and triggers)
CREATE POLICY "Allow profile insertion" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Update the trigger function to handle profile creation properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
declare
  raw_meta jsonb;
  name text;
  avatar text;
begin
  -- Ensure raw_user_meta_data is valid jsonb
  raw_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  name := coalesce(raw_meta->>'full_name', raw_meta->>'name', split_part(new.email, '@', 1));
  avatar := coalesce(raw_meta->>'avatar_url', raw_meta->>'picture', null);

  -- Insert profile with proper error handling
  begin
    insert into public.profiles (id, full_name, avatar_url, email)
    values (new.id, name, avatar, new.email);
  exception when others then
    -- Log the error but don't fail the user creation
    raise log 'Failed to create profile for user %: %', new.id, SQLERRM;
  end;

  return new;
end;
$$;