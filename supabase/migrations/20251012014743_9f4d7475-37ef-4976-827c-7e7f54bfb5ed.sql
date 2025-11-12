-- Create table for SEO automation logs
CREATE TABLE IF NOT EXISTS public.seo_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'sitemap_ping', 'indexnow_submit', etc.
  service_name TEXT NOT NULL, -- 'google', 'bing', 'yandex', 'indexnow'
  status TEXT NOT NULL, -- 'success', 'failed', 'retrying'
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_automation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view SEO logs"
  ON public.seo_automation_logs
  FOR SELECT
  USING (get_current_user_role() = 'admin');

-- System can insert logs
CREATE POLICY "System can insert SEO logs"
  ON public.seo_automation_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_seo_logs_article_id ON public.seo_automation_logs(article_id);
CREATE INDEX idx_seo_logs_created_at ON public.seo_automation_logs(created_at DESC);