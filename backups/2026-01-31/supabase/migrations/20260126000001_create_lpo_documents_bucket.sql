-- Create lpo-documents storage bucket and policies
DO $$
BEGIN
    -- 1. Create the bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'lpo-documents') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('lpo-documents', 'lpo-documents', true);
    END IF;

    -- 2. Create RLS Policies for lpo-documents bucket if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can upload lpo-documents'
    ) THEN
        CREATE POLICY "Authenticated users can upload lpo-documents"
        ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lpo-documents');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can view lpo-documents'
    ) THEN
        CREATE POLICY "Authenticated users can view lpo-documents"
        ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'lpo-documents');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can update their lpo-documents'
    ) THEN
        CREATE POLICY "Authenticated users can update their lpo-documents"
        ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'lpo-documents');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can delete lpo-documents'
    ) THEN
        CREATE POLICY "Authenticated users can delete lpo-documents"
        ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lpo-documents');
    END IF;
END $$;
