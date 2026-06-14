-- 040_create_cylinder_dispatch_requests.sql
-- Migration to support internal medical cylinder requests and dispatch

CREATE TABLE IF NOT EXISTS pharmacy_cylinder_dispatch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  request_number TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('manual_issue', 'unit_request')),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
  issuer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_date TIMESTAMP WITH TIME ZONE,
  issued_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  rejection_reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, request_number)
);

CREATE TABLE IF NOT EXISTS pharmacy_cylinder_dispatch_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_request_id UUID NOT NULL REFERENCES pharmacy_cylinder_dispatch_requests(id) ON DELETE CASCADE,
  size_code TEXT NOT NULL,
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  quantity_issued INTEGER DEFAULT 0 CHECK (quantity_issued >= 0),
  usage_notes TEXT,
  cylinder_id UUID REFERENCES pharmacy_oxygen_cylinder_inventory(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_hospital_id ON pharmacy_cylinder_dispatch_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_dept_id ON pharmacy_cylinder_dispatch_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_status ON pharmacy_cylinder_dispatch_requests(status);
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_req_date ON pharmacy_cylinder_dispatch_requests(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_cyl_dispatch_items_req_id ON pharmacy_cylinder_dispatch_request_items(dispatch_request_id);

-- Trigger to update updated_at
CREATE OR REPLACE TRIGGER update_pharmacy_cylinder_dispatch_requests_updated_at
  BEFORE UPDATE ON pharmacy_cylinder_dispatch_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE pharmacy_cylinder_dispatch_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_cylinder_dispatch_request_items ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacy_cylinder_dispatch_requests
CREATE POLICY "Users can manage dispatch requests for their hospital"
  ON pharmacy_cylinder_dispatch_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_cylinder_dispatch_requests.hospital_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_cylinder_dispatch_requests.hospital_id
    )
  );

-- Policies for pharmacy_cylinder_dispatch_request_items
CREATE POLICY "Users can manage dispatch request items for their hospital"
  ON pharmacy_cylinder_dispatch_request_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_cylinder_dispatch_requests r
      JOIN users u ON u.hospital_id = r.hospital_id
      WHERE r.id = pharmacy_cylinder_dispatch_request_items.dispatch_request_id
      AND u.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_cylinder_dispatch_requests r
      JOIN users u ON u.hospital_id = r.hospital_id
      WHERE r.id = pharmacy_cylinder_dispatch_request_items.dispatch_request_id
      AND u.id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE pharmacy_cylinder_dispatch_requests IS 'Requests and dispatches of cylinders to departments';
COMMENT ON TABLE pharmacy_cylinder_dispatch_request_items IS 'Items included in each cylinder dispatch request';
