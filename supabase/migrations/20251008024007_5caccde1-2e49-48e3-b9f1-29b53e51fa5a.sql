-- Generate unique usernames for existing profiles
-- Format: firstname + random 4-digit number

CREATE OR REPLACE FUNCTION generate_unique_username(user_full_name text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_name text;
  random_suffix text;
  new_username text;
  username_exists boolean;
BEGIN
  -- Extract first name and clean it
  base_name := lower(regexp_replace(
    coalesce(split_part(user_full_name, ' ', 1), 'author'),
    '[^a-zA-Z0-9]', '', 'g'
  ));
  
  -- Limit to 10 characters
  base_name := substring(base_name from 1 for 10);
  
  -- Try to find unique username
  FOR i IN 1..100 LOOP
    random_suffix := lpad(floor(random() * 10000)::text, 4, '0');
    new_username := base_name || random_suffix;
    
    -- Check if username exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE username = new_username AND id != user_id
    ) INTO username_exists;
    
    IF NOT username_exists THEN
      RETURN new_username;
    END IF;
  END LOOP;
  
  -- Fallback: use uuid prefix
  RETURN base_name || substring(replace(user_id::text, '-', '') from 1 for 4);
END;
$$;

-- Update existing profiles with unique usernames
UPDATE public.profiles
SET username = generate_unique_username(coalesce(full_name, 'author'), id)
WHERE username IS NULL OR username = '';

-- Make username required and unique going forward
ALTER TABLE public.profiles 
ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(username);

-- Trigger to auto-generate username for new users
CREATE OR REPLACE FUNCTION auto_generate_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := generate_unique_username(coalesce(NEW.full_name, 'author'), NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_username_on_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION auto_generate_username();