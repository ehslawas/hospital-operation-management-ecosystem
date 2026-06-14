-- 036_create_oxygen_return_documents.sql
-- Migration to support return documents for medical oxygen cylinders

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_return_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  returned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  remarks TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, document_number)
);

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_return_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_document_id UUID NOT NULL REFERENCES pharmacy_oxygen_return_documents(id) ON DELETE CASCADE,
  cylinder_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_inventory(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(return_document_id, cylinder_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_docs_hospital_id ON pharmacy_oxygen_return_documents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_docs_supplier_id ON pharmacy_oxygen_return_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_docs_created_at ON pharmacy_oxygen_return_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_doc_items_doc_id ON pharmacy_oxygen_return_document_items(return_document_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_ret_doc_items_cylinder_id ON pharmacy_oxygen_return_document_items(cylinder_id);

-- Trigger for updated_at on pharmacy_oxygen_return_documents
CREATE TRIGGER update_pharmacy_oxygen_return_documents_updated_at
  BEFORE UPDATE ON pharmacy_oxygen_return_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE pharmacy_oxygen_return_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_return_document_items ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacy_oxygen_return_documents
CREATE POLICY "Users can manage return documents for their hospital"
  ON pharmacy_oxygen_return_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_return_documents.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_return_documents.hospital_id
    )
  );

-- Policies for pharmacy_oxygen_return_document_items
CREATE POLICY "Users can manage return document items for their hospital"
  ON pharmacy_oxygen_return_document_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_return_documents d
      JOIN users u ON u.hospital_id = d.hospital_id
      WHERE d.id = pharmacy_oxygen_return_document_items.return_document_id
      AND u.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_return_documents d
      JOIN users u ON u.hospital_id = d.hospital_id
      WHERE d.id = pharmacy_oxygen_return_document_items.return_document_id
      AND u.id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE pharmacy_oxygen_return_documents IS 'Documents sent to suppliers when returning empty cylinders';
COMMENT ON TABLE pharmacy_oxygen_return_document_items IS 'Cylinders included in return documents';
