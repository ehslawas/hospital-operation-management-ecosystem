-- 058_create_cylinder_maintenance_tables.sql
-- Migration to support medical oxygen cylinder maintenance requests (similar to purchase orders)

-- Create cylinder maintenance requests parent table
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  maintenance_no VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'sent_to_supplier', 'in_progress', 'completed', 'cancelled'
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date TIMESTAMP WITH TIME ZONE,
  total_cost DECIMAL(12,2) DEFAULT 0.00,
  budget_source VARCHAR(50), -- e.g., 'warrant', 'appl', 'cc', 'lp'
  justification TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cylinder maintenance items table
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_maintenance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_maintenance(id) ON DELETE CASCADE,
  cylinder_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_inventory(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL, -- 'replacing_valve', 'painting', 'general_maintenance', 'hydrostatic_testing', 'other'
  cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pharmacy_oxygen_cylinder_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_cylinder_maintenance_items ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacy_oxygen_cylinder_maintenance
CREATE POLICY "Allow read access to maintenance requests for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_cylinder_maintenance.hospital_id
    )
  );

CREATE POLICY "Allow insert access to maintenance requests for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_cylinder_maintenance.hospital_id
    )
  );

CREATE POLICY "Allow update access to maintenance requests for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.hospital_id = pharmacy_oxygen_cylinder_maintenance.hospital_id
    )
  );

-- Policies for pharmacy_oxygen_cylinder_maintenance_items
CREATE POLICY "Allow read access to maintenance request items for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_cylinder_maintenance m
      JOIN users u ON u.hospital_id = m.hospital_id
      WHERE u.id = auth.uid()
      AND m.id = pharmacy_oxygen_cylinder_maintenance_items.maintenance_id
    )
  );

CREATE POLICY "Allow insert access to maintenance request items for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_cylinder_maintenance m
      JOIN users u ON u.hospital_id = m.hospital_id
      WHERE u.id = auth.uid()
      AND m.id = pharmacy_oxygen_cylinder_maintenance_items.maintenance_id
    )
  );

CREATE POLICY "Allow update/delete access to maintenance request items for hospital users"
  ON pharmacy_oxygen_cylinder_maintenance_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pharmacy_oxygen_cylinder_maintenance m
      JOIN users u ON u.hospital_id = m.hospital_id
      WHERE u.id = auth.uid()
      AND m.id = pharmacy_oxygen_cylinder_maintenance_items.maintenance_id
    )
  );

-- Trigger to update updated_at on pharmacy_oxygen_cylinder_maintenance
CREATE OR REPLACE FUNCTION update_pharmacy_oxygen_cylinder_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pharmacy_oxygen_cylinder_maintenance_updated_at
  BEFORE UPDATE ON pharmacy_oxygen_cylinder_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_pharmacy_oxygen_cylinder_maintenance_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maint_hospital_id ON pharmacy_oxygen_cylinder_maintenance(hospital_id);
CREATE INDEX IF NOT EXISTS idx_maint_supplier_id ON pharmacy_oxygen_cylinder_maintenance(supplier_id);
CREATE INDEX IF NOT EXISTS idx_maint_status ON pharmacy_oxygen_cylinder_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maint_items_maint_id ON pharmacy_oxygen_cylinder_maintenance_items(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maint_items_cyl_id ON pharmacy_oxygen_cylinder_maintenance_items(cylinder_id);

COMMENT ON TABLE pharmacy_oxygen_cylinder_maintenance IS 'Cylinder maintenance requests / purchase orders';
COMMENT ON TABLE pharmacy_oxygen_cylinder_maintenance_items IS 'Cylinders included in each maintenance request';
