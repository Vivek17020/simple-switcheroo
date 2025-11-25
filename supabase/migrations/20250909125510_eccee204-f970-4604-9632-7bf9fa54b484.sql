-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view author info for published articles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile insertion" ON public.profiles;
DROP POLICY IF EXISTS "System-only inserts" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create clean, working policies
CREATE POLICY "profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "profiles_select_authors" 
ON public.profiles 
FOR SELECT 
USING (id IN ( 
  SELECT DISTINCT articles.author_id
  FROM articles
  WHERE articles.published = true AND articles.author_id IS NOT NULL
));

CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Most important: Allow all inserts (for trigger function)
CREATE POLICY "profiles_insert_all" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);