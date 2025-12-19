-- Fix the RLS policies on profiles table to allow system inserts
DROP POLICY IF EXISTS "System-only inserts" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a single policy that allows both user inserts and system inserts
CREATE POLICY "Allow profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Update the trigger function to be more robust
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

  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, name, avatar, new.email)
  on conflict (id) do update
    set full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();