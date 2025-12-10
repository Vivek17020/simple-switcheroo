-- Add all UPSC subcategories with unique names
-- Using UPSC prefix to avoid duplicate name conflicts

-- Insert missing GS subjects with unique names
INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Environment', 'upsc-environment', 'Environment and Ecology for UPSC', '#16A34A',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-environment');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC International Relations', 'upsc-international-relations', 'International Relations for UPSC', '#0891B2',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-international-relations');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Society', 'upsc-society', 'Indian Society for UPSC', '#EA580C',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-society');

-- Insert Prelims categories
INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Prelims GS Notes', 'upsc-prelims-gs-notes', 'General Studies notes for Prelims', '#3B82F6',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-prelims-gs-notes');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Topic-wise MCQs', 'upsc-topic-wise-mcqs', 'Practice MCQs by topic', '#8B5CF6',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-topic-wise-mcqs');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC CSAT', 'upsc-csat', 'CSAT Preparation Material', '#EC4899',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-csat');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Prelims PYQs', 'upsc-prelims-pyq', 'Previous Year Questions for Prelims', '#F59E0B',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-prelims-pyq');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Prelims Mock Tests', 'upsc-prelims-mock-tests', 'Mock Tests for Prelims', '#10B981',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-prelims-mock-tests');

-- Insert Mains categories
INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC GS Paper 1', 'upsc-gs1', 'General Studies Paper 1 - Indian Heritage, History, Geography', '#2563EB',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-gs1');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC GS Paper 2', 'upsc-gs2', 'General Studies Paper 2 - Governance, Constitution, Polity', '#7C3AED',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-gs2');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC GS Paper 3', 'upsc-gs3', 'General Studies Paper 3 - Economy, Environment, Science & Tech', '#059669',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-gs3');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC GS Paper 4', 'upsc-gs4', 'General Studies Paper 4 - Ethics, Integrity, Aptitude', '#DC2626',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-gs4');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Essay Strategy', 'upsc-essay-strategy', 'Essay Writing Strategy and Practice', '#DB2777',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-essay-strategy');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Model Answers', 'upsc-model-answers', 'Model Answers for Mains Questions', '#0EA5E9',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-model-answers');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Mains PYQs', 'upsc-mains-pyq', 'Previous Year Questions for Mains', '#F97316',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-mains-pyq');

-- Insert Current Affairs categories
INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Daily Current Affairs', 'upsc-daily-ca', 'Daily Current Affairs Updates', '#EF4444',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-daily-ca');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Monthly Current Affairs', 'upsc-monthly-ca', 'Monthly Current Affairs Compilation', '#8B5CF6',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-monthly-ca');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC PIB Summary', 'upsc-pib-summary', 'Press Information Bureau Summaries', '#06B6D4',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-pib-summary');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Yojana Summary', 'upsc-yojana-summary', 'Yojana Magazine Summaries', '#84CC16',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-yojana-summary');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Kurukshetra Summary', 'upsc-kurukshetra-summary', 'Kurukshetra Magazine Summaries', '#F59E0B',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-kurukshetra-summary');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Editorial Notes', 'upsc-editorial-notes', 'Newspaper Editorial Analysis', '#6366F1',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-editorial-notes');

-- Insert Optional Subject categories
INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC PSIR', 'upsc-psir', 'Political Science & International Relations', '#2563EB',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-psir');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Sociology Optional', 'upsc-sociology-optional', 'Sociology Optional Subject', '#7C3AED',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-sociology-optional');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Geography Optional', 'upsc-geography-optional', 'Geography Optional Subject', '#D97706',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-geography-optional');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Anthropology', 'upsc-anthropology', 'Anthropology Optional Subject', '#059669',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-anthropology');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Public Administration', 'upsc-public-admin', 'Public Administration Optional', '#DC2626',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-public-admin');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC History Optional', 'upsc-history-optional', 'History Optional Subject', '#B91C1C',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-history-optional');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Philosophy', 'upsc-philosophy', 'Philosophy Optional Subject', '#4F46E5',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-philosophy');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Economics Optional', 'upsc-economics-optional', 'Economics Optional Subject', '#059669',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-economics-optional');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Literature Optionals', 'upsc-literature-optional', 'Literature Optional Subjects', '#DB2777',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-literature-optional');

-- Insert Practice categories
INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Daily Quiz', 'upsc-daily-quiz', 'Daily Practice Quiz', '#EF4444',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-daily-quiz');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Weekly Quiz', 'upsc-weekly-quiz', 'Weekly Practice Quiz', '#8B5CF6',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-weekly-quiz');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Topic Tests', 'upsc-topic-test', 'Topic-wise Tests', '#06B6D4',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-topic-test');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Flashcards', 'upsc-flashcards', 'Quick Revision Flashcards', '#84CC16',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-flashcards');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Revision Notes', 'upsc-revision-notes', 'Concise Revision Notes', '#F59E0B',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-revision-notes');

-- Insert Resources categories
INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Syllabus', 'upsc-syllabus', 'Complete UPSC Syllabus', '#2563EB',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-syllabus');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC NCERT Notes', 'upsc-ncert-notes', 'NCERT Summary Notes', '#059669',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-ncert-notes');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Booklist', 'upsc-booklist', 'Standard Book Recommendations', '#DC2626',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-booklist');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Previous Year Papers', 'upsc-pyp', 'Previous Year Papers Collection', '#7C3AED',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-pyp');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Maps and Infographics', 'upsc-maps-infographics', 'Maps and Visual Resources', '#D97706',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-maps-infographics');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC Calendar', 'upsc-calendar', 'UPSC Exam Calendar', '#0EA5E9',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-calendar');

INSERT INTO public.categories (name, slug, description, color, parent_id)
SELECT 'UPSC PDF Downloads', 'upsc-pdf-downloads', 'Downloadable Study Materials', '#DB2777',
  (SELECT id FROM public.categories WHERE slug = 'upscbriefs')
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'upsc-pdf-downloads');