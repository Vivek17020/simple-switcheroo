-- Create RLS policies for exam-papers storage bucket
-- Allow authenticated admins to upload files
CREATE POLICY "Admins can upload exam papers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-papers' 
  AND (get_current_user_role() = 'admin' OR auth.role() = 'authenticated')
);

-- Allow authenticated admins to update files
CREATE POLICY "Admins can update exam papers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'exam-papers' AND (get_current_user_role() = 'admin' OR auth.role() = 'authenticated'))
WITH CHECK (bucket_id = 'exam-papers' AND (get_current_user_role() = 'admin' OR auth.role() = 'authenticated'));

-- Allow authenticated admins to delete files
CREATE POLICY "Admins can delete exam papers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'exam-papers' AND (get_current_user_role() = 'admin' OR auth.role() = 'authenticated'));

-- Allow everyone to view/download files (bucket is public)
CREATE POLICY "Anyone can download exam papers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'exam-papers');