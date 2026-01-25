-- 1. Create Documents Table for Multi-DO Support
CREATE TABLE IF NOT EXISTS pharmacy_receiving_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receiving_id UUID NOT NULL REFERENCES pharmacy_receiving(id) ON DELETE CASCADE,
    do_number VARCHAR(100),
    do_document_url TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receiving_docs_receiving ON pharmacy_receiving_documents(receiving_id);

-- 2. Add Manufactured Date to Items
ALTER TABLE pharmacy_receiving_items 
ADD COLUMN IF NOT EXISTS manufactured_date DATE;

-- 3. Add Missing Details Flags to Receiving Header
ALTER TABLE pharmacy_receiving 
ADD COLUMN IF NOT EXISTS has_missing_details BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS missing_details_completed_at TIMESTAMPTZ;

-- 4. Enable RLS for new table
ALTER TABLE pharmacy_receiving_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON pharmacy_receiving_documents 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
