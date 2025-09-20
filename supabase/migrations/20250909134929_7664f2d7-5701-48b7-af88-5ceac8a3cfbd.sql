-- Fix the trigger function to handle JSON data properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
declare
  raw_meta jsonb := '{}';
  name text;
  avatar text;
begin
  -- Safely handle raw_user_meta_data
  begin
    raw_meta := coalesce(new.raw_user_meta_data, '{}');
  exception when others then
    raw_meta := '{}';
  end;

  -- Extract user data with fallbacks
  name := coalesce(
    raw_meta->>'full_name', 
    raw_meta->>'name', 
    split_part(coalesce(new.email, 'user'), '@', 1)
  );
  
  avatar := coalesce(
    raw_meta->>'avatar_url', 
    raw_meta->>'picture'
  );

  -- Insert profile with comprehensive error handling
  begin
    insert into public.profiles (id, full_name, avatar_url, email)
    values (
      new.id, 
      name, 
      avatar, 
      new.email
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      avatar_url = excluded.avatar_url,
      email = excluded.email,
      updated_at = now();
      
  exception when others then
    -- Log error but don't fail authentication
    raise log 'Profile creation failed for user %: %', new.id, SQLERRM;
  end;

  return new;
end;
$$;

-- Ensure trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();