-- Add exam_title column and make exam_id nullable to support free-text exam titles
ALTER TABLE exam_papers 
ADD COLUMN IF NOT EXISTS exam_title TEXT;

-- Update existing records to copy exam name from exam_list
UPDATE exam_papers 
SET exam_title = exam_list.exam_name
FROM exam_list
WHERE exam_papers.exam_id = exam_list.id
AND exam_papers.exam_title IS NULL;

-- Make exam_id nullable since we'll use exam_title going forward
ALTER TABLE exam_papers 
ALTER COLUMN exam_id DROP NOT NULL;