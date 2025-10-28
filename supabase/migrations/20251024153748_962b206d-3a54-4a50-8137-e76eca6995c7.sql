-- Create SEO auto-fix verification table
CREATE TABLE IF NOT EXISTS public.seo_autofix_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  fix_action TEXT NOT NULL,
  fix_applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  internal_status TEXT NOT NULL DEFAULT 'pending',
  gsc_status TEXT DEFAULT 'pending',
  recheck_notes TEXT,
  rechecked_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_seo_verification_url ON public.seo_autofix_verification(url);
CREATE INDEX idx_seo_verification_status ON public.seo_autofix_verification(gsc_status);
CREATE INDEX idx_seo_verification_applied_at ON public.seo_autofix_verification(fix_applied_at);

-- Enable RLS
ALTER TABLE public.seo_autofix_verification ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage all verification records
CREATE POLICY "seo_verification_admin_all"
  ON public.seo_autofix_verification
  FOR ALL
  USING (get_current_user_role() = 'admin');

-- System can insert verification records
CREATE POLICY "seo_verification_system_insert"
  ON public.seo_autofix_verification
  FOR INSERT
  WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_seo_verification_updated_at
  BEFORE UPDATE ON public.seo_autofix_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create Google Search Console configuration table
CREATE TABLE IF NOT EXISTS public.gsc_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url TEXT NOT NULL,
  client_id TEXT,
  client_secret TEXT,
  refresh_token TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for GSC config
ALTER TABLE public.gsc_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage GSC config
CREATE POLICY "gsc_config_admin_only"
  ON public.gsc_config
  FOR ALL
  USING (get_current_user_role() = 'admin');