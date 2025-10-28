-- Insert Jobs subcategories
INSERT INTO public.categories (name, slug, description, color) VALUES
  ('Jobs/Admit Cards', 'jobs-admit-cards', 'Latest admit cards and hall tickets for government job exams', 'general'),
  ('Jobs/Results', 'jobs-results', 'Exam results and merit lists for government job examinations', 'general'),
  ('Jobs/Syllabus', 'jobs-syllabus', 'Complete syllabus and exam patterns for government job exams', 'general'),
  ('Jobs/Previous Year Papers', 'jobs-previous-year-papers', 'Previous year question papers and sample papers for government exams', 'general')
ON CONFLICT (slug) DO NOTHING;