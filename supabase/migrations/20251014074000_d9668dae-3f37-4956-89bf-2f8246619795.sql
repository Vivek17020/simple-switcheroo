-- Fix the search_path security issue for the function
DROP TRIGGER IF EXISTS exam_list_updated_at ON public.exam_list;
DROP FUNCTION IF EXISTS update_exam_list_updated_at();

CREATE OR REPLACE FUNCTION update_exam_list_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER exam_list_updated_at
  BEFORE UPDATE ON public.exam_list
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_list_updated_at();