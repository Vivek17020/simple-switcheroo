-- Phase 4.1: Extend articles table with SEO columns
ALTER TABLE articles ADD COLUMN IF NOT EXISTS primary_keyword TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS lsi_keywords TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS keyword_density NUMERIC;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS target_queries TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS faq_schema JSONB;

-- Phase 4.2: Create keyword performance tracking table
CREATE TABLE IF NOT EXISTS keyword_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_position INTEGER,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE keyword_performance ENABLE ROW LEVEL SECURITY;

-- Admin can manage all
CREATE POLICY "keyword_performance_admin_all" ON keyword_performance
  FOR ALL USING (get_current_user_role() = 'admin');

-- Public can view
CREATE POLICY "keyword_performance_public_read" ON keyword_performance
  FOR SELECT USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_keyword_performance_article ON keyword_performance(article_id);
CREATE INDEX IF NOT EXISTS idx_keyword_performance_keyword ON keyword_performance(keyword);

-- Add trigger for updated_at
CREATE TRIGGER update_keyword_performance_updated_at
  BEFORE UPDATE ON keyword_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();