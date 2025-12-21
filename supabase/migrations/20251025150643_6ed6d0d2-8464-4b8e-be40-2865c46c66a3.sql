-- Create push_analytics table for tracking notification delivery and engagement
CREATE TABLE IF NOT EXISTS public.push_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  delivered INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  subscribers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies (admin only)
CREATE POLICY "Only admins can view push analytics"
  ON public.push_analytics
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can insert push analytics"
  ON public.push_analytics
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update push analytics"
  ON public.push_analytics
  FOR UPDATE
  USING (public.is_admin());

-- Create index on date
CREATE INDEX idx_push_analytics_date ON public.push_analytics(date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_push_analytics_updated_at
  BEFORE UPDATE ON public.push_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();