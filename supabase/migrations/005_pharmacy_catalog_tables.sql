-- Pharmacy Catalog Tables
-- This migration creates tables for drug and non-drug catalog management
-- Run this after base tables (000_base_tables.sql)

-- ============================================
-- 1. Uploaded Files Tracking Table
-- ============================================
-- Tracks uploaded files to prevent duplicates
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 hash of file content
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- 'excel', 'pdf', 'image'
  catalog_type TEXT NOT NULL CHECK (catalog_type IN ('drug', 'non_drug')),
  upload_status TEXT NOT NULL DEFAULT 'completed' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
  items_imported INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, file_hash) -- Prevent duplicate file uploads
);

-- Indexes for uploaded_files
CREATE INDEX IF NOT EXISTS idx_uploaded_files_hospital_id ON uploaded_files(hospital_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_hash ON uploaded_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_catalog_type ON uploaded_files(catalog_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at DESC);

-- ============================================
-- 2. Drug Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS drug_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  parent_category_id UUID REFERENCES drug_categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, category_code)
);

-- Indexes for drug_categories
CREATE INDEX IF NOT EXISTS idx_drug_categories_hospital_id ON drug_categories(hospital_id);
CREATE INDEX IF NOT EXISTS idx_drug_categories_code ON drug_categories(category_code);
CREATE INDEX IF NOT EXISTS idx_drug_categories_parent ON drug_categories(parent_category_id);

-- ============================================
-- 3. Non-Drug Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS non_drug_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  parent_category_id UUID REFERENCES non_drug_categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, category_code)
);

-- Indexes for non_drug_categories
CREATE INDEX IF NOT EXISTS idx_non_drug_categories_hospital_id ON non_drug_categories(hospital_id);
CREATE INDEX IF NOT EXISTS idx_non_drug_categories_code ON non_drug_categories(category_code);
CREATE INDEX IF NOT EXISTS idx_non_drug_categories_parent ON non_drug_categories(parent_category_id);

-- ============================================
-- 4. Suppliers Table
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  supplier_code TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  registration_number TEXT,
  bank_account TEXT,
  bank_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
  performance_rating DECIMAL(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, supplier_code)
);

-- Indexes for suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_hospital_id ON suppliers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- ============================================
-- 5. Drugs Table
-- ============================================
CREATE TABLE IF NOT EXISTS drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  drug_code TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  generic_name TEXT,
  brand_name TEXT,
  dosage_form TEXT NOT NULL CHECK (dosage_form IN ('tablet', 'capsule', 'injection', 'syrup', 'suspension', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'suppository', 'powder', 'solution', 'other')),
  strength TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'unit',
  category_id UUID REFERENCES drug_categories(id) ON DELETE SET NULL,
  is_controlled BOOLEAN NOT NULL DEFAULT false,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  storage_conditions TEXT,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER,
  lead_time_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  -- Catalog-specific fields
  sku TEXT,
  pku TEXT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  procurement_vote TEXT CHECK (procurement_vote IN ('appl', 'cc', 'dp', 'lp')),
  price DECIMAL(10,2),
  packaging_description TEXT,
  item_sub_class TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, drug_code)
);

-- Indexes for drugs
CREATE INDEX IF NOT EXISTS idx_drugs_hospital_id ON drugs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_drugs_code ON drugs(drug_code);
CREATE INDEX IF NOT EXISTS idx_drugs_category_id ON drugs(category_id);
CREATE INDEX IF NOT EXISTS idx_drugs_supplier_id ON drugs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_drugs_status ON drugs(status);
CREATE INDEX IF NOT EXISTS idx_drugs_name ON drugs(drug_name);
CREATE INDEX IF NOT EXISTS idx_drugs_sku ON drugs(sku);
CREATE INDEX IF NOT EXISTS idx_drugs_pku ON drugs(pku);

-- ============================================
-- 6. Non-Drugs Table
-- ============================================
CREATE TABLE IF NOT EXISTS non_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES non_drug_categories(id) ON DELETE SET NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'unit',
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  -- Catalog-specific fields
  sku TEXT,
  pku TEXT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  procurement_vote TEXT CHECK (procurement_vote IN ('appl', 'cc', 'dp', 'lp')),
  price DECIMAL(10,2),
  packaging_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, item_code)
);

-- Indexes for non_drugs
CREATE INDEX IF NOT EXISTS idx_non_drugs_hospital_id ON non_drugs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_non_drugs_code ON non_drugs(item_code);
CREATE INDEX IF NOT EXISTS idx_non_drugs_category_id ON non_drugs(category_id);
CREATE INDEX IF NOT EXISTS idx_non_drugs_supplier_id ON non_drugs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_non_drugs_status ON non_drugs(status);
CREATE INDEX IF NOT EXISTS idx_non_drugs_name ON non_drugs(item_name);
CREATE INDEX IF NOT EXISTS idx_non_drugs_sku ON non_drugs(sku);
CREATE INDEX IF NOT EXISTS idx_non_drugs_pku ON non_drugs(pku);

-- ============================================
-- 7. Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_uploaded_files_updated_at
  BEFORE UPDATE ON uploaded_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drug_categories_updated_at
  BEFORE UPDATE ON drug_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_non_drug_categories_updated_at
  BEFORE UPDATE ON non_drug_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drugs_updated_at
  BEFORE UPDATE ON drugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_non_drugs_updated_at
  BEFORE UPDATE ON non_drugs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Helper Function: Check File Hash
-- ============================================
-- Function to check if a file with the same hash has been uploaded
CREATE OR REPLACE FUNCTION check_file_duplicate(
  p_hospital_id UUID,
  p_file_hash TEXT
)
RETURNS TABLE (
  file_id UUID,
  file_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  items_imported INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uf.id,
    uf.file_name,
    uf.uploaded_at,
    uf.items_imported
  FROM uploaded_files uf
  WHERE uf.hospital_id = p_hospital_id
    AND uf.file_hash = p_file_hash
    AND uf.upload_status = 'completed'
  ORDER BY uf.uploaded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Helper Function: Get or Create Category
-- ============================================
-- Function to get or create a drug category
CREATE OR REPLACE FUNCTION get_or_create_drug_category(
  p_hospital_id UUID,
  p_category_name TEXT,
  p_category_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_category_id UUID;
  v_code TEXT;
BEGIN
  -- Generate code if not provided
  v_code := COALESCE(p_category_code, UPPER(SUBSTRING(REGEXP_REPLACE(p_category_name, '[^a-zA-Z0-9]', '', 'g'), 1, 20)));
  
  -- Try to find existing category
  SELECT id INTO v_category_id
  FROM drug_categories
  WHERE hospital_id = p_hospital_id
    AND (category_name = p_category_name OR category_code = v_code)
  LIMIT 1;
  
  -- If not found, create new
  IF v_category_id IS NULL THEN
    INSERT INTO drug_categories (hospital_id, category_code, category_name)
    VALUES (p_hospital_id, v_code, p_category_name)
    RETURNING id INTO v_category_id;
  END IF;
  
  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create a non-drug category
CREATE OR REPLACE FUNCTION get_or_create_non_drug_category(
  p_hospital_id UUID,
  p_category_name TEXT,
  p_category_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_category_id UUID;
  v_code TEXT;
BEGIN
  -- Generate code if not provided
  v_code := COALESCE(p_category_code, UPPER(SUBSTRING(REGEXP_REPLACE(p_category_name, '[^a-zA-Z0-9]', '', 'g'), 1, 20)));
  
  -- Try to find existing category
  SELECT id INTO v_category_id
  FROM non_drug_categories
  WHERE hospital_id = p_hospital_id
    AND (category_name = p_category_name OR category_code = v_code)
  LIMIT 1;
  
  -- If not found, create new
  IF v_category_id IS NULL THEN
    INSERT INTO non_drug_categories (hospital_id, category_code, category_name)
    VALUES (p_hospital_id, v_code, p_category_name)
    RETURNING id INTO v_category_id;
  END IF;
  
  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Comments
-- ============================================
COMMENT ON TABLE uploaded_files IS 'Tracks uploaded catalog files to prevent duplicate uploads';
COMMENT ON TABLE drug_categories IS 'Drug categories for catalog organization';
COMMENT ON TABLE non_drug_categories IS 'Non-drug categories for catalog organization';
COMMENT ON TABLE suppliers IS 'Suppliers for procurement';
COMMENT ON TABLE drugs IS 'Drug catalog items';
COMMENT ON TABLE non_drugs IS 'Non-drug catalog items';
COMMENT ON FUNCTION check_file_duplicate IS 'Checks if a file with the same hash has been uploaded before';
COMMENT ON FUNCTION get_or_create_drug_category IS 'Gets existing or creates new drug category';
COMMENT ON FUNCTION get_or_create_non_drug_category IS 'Gets existing or creates new non-drug category';

