-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('articles', 'articles', true);

-- Create policies for article images
CREATE POLICY "Article images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'articles');

CREATE POLICY "Authenticated users can upload article images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'articles' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update article images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'articles' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete article images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'articles' AND auth.role() = 'authenticated');