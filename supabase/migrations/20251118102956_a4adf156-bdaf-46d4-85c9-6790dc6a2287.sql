-- Create SEO health log table
CREATE TABLE IF NOT EXISTS public.seo_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create SEO audit reports table
CREATE TABLE IF NOT EXISTS public.seo_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  audit_completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  total_articles_scanned INTEGER NOT NULL DEFAULT 0,
  total_issues_found INTEGER NOT NULL DEFAULT 0,
  critical_issues INTEGER NOT NULL DEFAULT 0,
  warning_issues INTEGER NOT NULL DEFAULT 0,
  info_issues INTEGER NOT NULL DEFAULT 0,
  auto_fixed_count INTEGER NOT NULL DEFAULT 0,
  ai_detection_accuracy NUMERIC(5,2),
  auto_fix_success_rate NUMERIC(5,2),
  reindex_success_rate NUMERIC(5,2),
  report_data JSONB
);

-- Create SEO autofix verification table
CREATE TABLE IF NOT EXISTS public.seo_autofix_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.seo_health_log(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  fix_attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed')),
  gsc_status TEXT CHECK (gsc_status IN ('indexed', 'pending', 'error')),
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.seo_health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_autofix_verification ENABLE ROW LEVEL SECURITY;

-- RLS policies for seo_health_log
CREATE POLICY "Admins can view all SEO health logs"
  ON public.seo_health_log FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert SEO health logs"
  ON public.seo_health_log FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update SEO health logs"
  ON public.seo_health_log FOR UPDATE
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete SEO health logs"
  ON public.seo_health_log FOR DELETE
  USING (get_current_user_role() = 'admin');

-- RLS policies for seo_audit_reports
CREATE POLICY "Admins can view all SEO audit reports"
  ON public.seo_audit_reports FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert SEO audit reports"
  ON public.seo_audit_reports FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

-- RLS policies for seo_autofix_verification
CREATE POLICY "Admins can view all SEO autofix verifications"
  ON public.seo_autofix_verification FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert SEO autofix verifications"
  ON public.seo_autofix_verification FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update SEO autofix verifications"
  ON public.seo_autofix_verification FOR UPDATE
  USING (get_current_user_role() = 'admin');

-- Create indexes for better performance
CREATE INDEX idx_seo_health_log_article_id ON public.seo_health_log(article_id);
CREATE INDEX idx_seo_health_log_status ON public.seo_health_log(status);
CREATE INDEX idx_seo_health_log_severity ON public.seo_health_log(severity);
CREATE INDEX idx_seo_health_log_detected_at ON public.seo_health_log(detected_at DESC);
CREATE INDEX idx_seo_audit_reports_created_at ON public.seo_audit_reports(created_at DESC);
CREATE INDEX idx_seo_autofix_verification_issue_id ON public.seo_autofix_verification(issue_id);
CREATE INDEX idx_seo_autofix_verification_article_id ON public.seo_autofix_verification(article_id);