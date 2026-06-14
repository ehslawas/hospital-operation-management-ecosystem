-- 039_create_oxygen_request_documents.sql
-- Migration to support request documents for medical oxygen cylinders

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_request_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  remarks TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, document_number)
);

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_request_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_document_id UUID NOT NULL REFERENCES pharmacy_oxygen_request_documents(id) ON DELETE CASCADE,
  size_code TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  usage_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oxygen_req_docs_hospital_id ON pharmacy_oxygen_request_documents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_req_docs_supplier_id ON pharmacy_oxygen_request_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_req_docs_created_at ON pharmacy_oxygen_request_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oxygen_req_doc_items_doc_id ON pharmacy_oxygen_request_document_items(request_document_id);

-- Trigger for updated_at on pharmacy_oxygen_request_documents
CREATE OR REPLACE TRIGGER update_pharmacy_oxygen_request_documents_updated_at
  BEFORE UPDATE ON pharmacy_oxygen_request_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE pharmacy_oxygen_request_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_request_document_items ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacy_oxygen_request_documents
CREATE POLICY "Users can manage request documents for their hospital"
  ON pharmacy_oxygen_request_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_request_documents.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_request_documents.hospital_id
    )
  );

-- Policies for pharmacy_oxygen_request_document_items
CREATE POLICY "Users can manage request document items for their hospital"
  ON pharmacy_oxygen_request_document_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_request_documents d
      JOIN users u ON u.hospital_id = d.hospital_id
      WHERE d.id = pharmacy_oxygen_request_document_items.request_document_id
      AND u.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_request_documents d
      JOIN users u ON u.hospital_id = d.hospital_id
      WHERE d.id = pharmacy_oxygen_request_document_items.request_document_id
      AND u.id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE pharmacy_oxygen_request_documents IS 'Documents sent to suppliers when requesting cylinder refills or supplies';
COMMENT ON TABLE pharmacy_oxygen_request_document_items IS 'Cylinders size codes and quantities requested in request documents';
