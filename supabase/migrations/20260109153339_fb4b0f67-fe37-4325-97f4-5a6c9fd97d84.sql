-- Create post-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all post images
CREATE POLICY "Anyone can view post images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- Allow users to update their own post images
CREATE POLICY "Users can update their own post images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);