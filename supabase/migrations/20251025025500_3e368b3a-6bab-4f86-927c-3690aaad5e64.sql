-- Create SEO Audit Reports table
CREATE TABLE IF NOT EXISTS public.seo_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  audit_completed_at TIMESTAMP WITH TIME ZONE,
  total_articles_scanned INTEGER NOT NULL DEFAULT 0,
  total_issues_found INTEGER NOT NULL DEFAULT 0,
  critical_issues INTEGER NOT NULL DEFAULT 0,
  warning_issues INTEGER NOT NULL DEFAULT 0,
  info_issues INTEGER NOT NULL DEFAULT 0,
  issues_auto_fixed INTEGER NOT NULL DEFAULT 0,
  issues_remaining INTEGER NOT NULL DEFAULT 0,
  ai_detection_accuracy DECIMAL(5,2),
  auto_fix_success_rate DECIMAL(5,2),
  reindex_success_rate DECIMAL(5,2),
  average_fix_time_seconds INTEGER,
  audit_status TEXT NOT NULL DEFAULT 'in_progress',
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_audit_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "seo_audit_reports_admin_all"
  ON public.seo_audit_reports
  FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE POLICY "seo_audit_reports_system_insert"
  ON public.seo_audit_reports
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_seo_audit_reports_created_at 
  ON public.seo_audit_reports(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_seo_audit_reports_updated_at
  BEFORE UPDATE ON public.seo_audit_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();