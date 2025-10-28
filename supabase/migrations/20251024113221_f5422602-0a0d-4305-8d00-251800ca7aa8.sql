-- Create SEO health monitoring table
CREATE TABLE IF NOT EXISTS public.seo_health_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  issue_type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  resolution_status text DEFAULT 'pending',
  notes text,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE,
  severity text DEFAULT 'warning',
  auto_fix_attempted boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_health_log ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all SEO logs
CREATE POLICY "seo_health_admin_all"
  ON public.seo_health_log
  FOR ALL
  USING (get_current_user_role() = 'admin');

-- System can insert SEO logs
CREATE POLICY "seo_health_system_insert"
  ON public.seo_health_log
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_seo_health_status ON public.seo_health_log(status);
CREATE INDEX IF NOT EXISTS idx_seo_health_detected_at ON public.seo_health_log(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_health_article_id ON public.seo_health_log(article_id);

-- Add trigger for updated_at
CREATE TRIGGER update_seo_health_log_updated_at
  BEFORE UPDATE ON public.seo_health_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();