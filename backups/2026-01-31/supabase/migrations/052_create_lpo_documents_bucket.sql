DO $$
BEGIN
    -- 1. Create the bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('documents', 'documents', true);
    END IF;

    -- 2. Create RLS Policies for documents bucket if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can upload documents'
    ) THEN
        CREATE POLICY "Authenticated users can upload documents"
        ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can view documents'
    ) THEN
        CREATE POLICY "Authenticated users can view documents"
        ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can update their documents'
    ) THEN
        CREATE POLICY "Authenticated users can update their documents"
        ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can delete documents'
    ) THEN
        CREATE POLICY "Authenticated users can delete documents"
        ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');
    END IF;
END $$;
