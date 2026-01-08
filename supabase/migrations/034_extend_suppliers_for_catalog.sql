-- Extend suppliers table with additional catalog fields
-- - supplier_type: drug / non_drug / both
-- - contact_person_phone: direct phone for person in charge (PIC)
-- - account_number: supplier bank account number
-- - account_document_url: URL to uploaded bank/account document (PDF)
-- - mof_certificate_url: URL to uploaded MOF certificate (PDF)
-- Also seed core Malaysian suppliers used by the Pharmacy Logistics module.

-- ================================
-- 1. New Columns
-- ================================

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS supplier_type TEXT CHECK (supplier_type IN ('drug', 'non_drug', 'both')),
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_document_url TEXT,
ADD COLUMN IF NOT EXISTS mof_certificate_url TEXT;

-- Helpful index for filtering by supplier_type
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_type ON suppliers(supplier_type);

COMMENT ON COLUMN suppliers.supplier_type IS 'Type of supplier: drug, non_drug, or both';
COMMENT ON COLUMN suppliers.contact_person_phone IS 'Direct phone number of the main person in charge (PIC)';
COMMENT ON COLUMN suppliers.account_number IS 'Primary bank account number for payments';
COMMENT ON COLUMN suppliers.account_document_url IS 'Storage URL of supporting document that confirms account number (PDF)';
COMMENT ON COLUMN suppliers.mof_certificate_url IS 'Storage URL of supplier MOF certificate (PDF)';

-- ================================
-- 2. Seed Core Malaysian Suppliers
-- ================================
-- NOTE:
-- - These records are seeded with NULL hospital_id so they can be
--   reused across hospitals.
-- - If the record already exists (matched by company_name), it will
--   NOT be duplicated.

INSERT INTO suppliers (
  hospital_id,
  supplier_code,
  company_name,
  contact_person,
  contact_person_phone,
  email,
  phone,
  address,
  registration_number,
  bank_account,
  bank_name,
  supplier_type,
  status,
  performance_rating,
  notes
)
SELECT
  NULL AS hospital_id,
  s.supplier_code,
  s.company_name,
  s.contact_person,
  s.contact_person_phone,
  s.email,
  s.phone,
  s.address,
  s.registration_number,
  s.bank_account,
  s.bank_name,
  s.supplier_type,
  'active' AS status,
  s.performance_rating,
  s.notes
FROM (
  VALUES
    -- Drug-focused suppliers
    ('SUP-PHARMA-PLB', 'Pharmaniaga Logistics Sdn Bhd', 'Corporate Sales Team', '+60-3-3342-9999', 'info@pharmaniaga.com', '+60-3-3342-9999',
     'No. 7, Lorong Keluli 1A, Kawasan Perindustrian Bukit Raja Selatan, 40000 Shah Alam, Selangor',
     'ROC-000001', '8600-000000-01', 'Maybank', 'drug', 4.6, 'National drug distribution and logistics partner for MOH hospitals'),
    ('SUP-PHARMA-MSALLY', 'MS Ally Pharma Sdn Bhd', 'Sales Manager', '+60-3-0000-0000', 'sales@msally.com.my', '+60-3-0000-0000',
     'Petaling Jaya, Selangor, Malaysia',
     'ROC-000002', NULL, NULL, 'drug', 4.0, 'Regional pharmaceutical wholesaler and distributor'),
    ('SUP-PHARMA-BORNEO', 'Borneo Pharmacy Sdn Bhd', 'Key Account Manager', '+60-82-000000', 'info@borneopharmacy.com', '+60-82-000000',
     'Kuching, Sarawak, Malaysia',
     'ROC-000003', NULL, NULL, 'drug', 4.0, 'Drug and medical supplies distributor serving East Malaysia'),
    ('SUP-PHARMA-TERAJU', 'Teraju Farma Sdn Bhd', 'Business Development', '+60-3-0000-0001', 'info@terajufarma.com', '+60-3-0000-0001',
     'Shah Alam, Selangor, Malaysia',
     'ROC-000004', NULL, NULL, 'drug', 3.9, 'Supplier of oral and injectable medicines'),
    ('SUP-PHARMA-WIJA', 'Wija Pharma Sdn Bhd', 'Operations Manager', '+60-3-0000-0002', 'info@wijapharma.com', '+60-3-0000-0002',
     'Kuala Lumpur, Malaysia',
     'ROC-000005', NULL, NULL, 'drug', 3.9, 'General pharmaceutical and hospital supply company'),
    ('SUP-PHARMA-DUO', 'Duopharma (M) Sdn Bhd', 'Key Account Manager', '+60-3-6156-1234', 'info@duopharma.com', '+60-3-6156-1234',
     'Lot 2, Jalan P/2, Kawasan MIEL Seksyen 13, 40000 Shah Alam, Selangor',
     'ROC-234567', NULL, NULL, 'drug', 4.2, 'Local manufacturer and supplier of generic pharmaceuticals'),
    ('SUP-PHARMA-HANAN', 'Hanan Medicare Sdn Bhd', 'Sales Executive', '+60-3-0000-0003', 'sales@hananmedicare.com', '+60-3-0000-0003',
     'Selangor, Malaysia',
     'ROC-000006', NULL, NULL, 'drug', 3.8, 'Supplier of pharmacy and ward medicines'),
    ('SUP-PHARMA-2K', '2K Medicare Sdn Bhd', 'Sales Manager', '+60-3-0000-0004', 'info@2kmedicare.com', '+60-3-0000-0004',
     'Klang Valley, Selangor, Malaysia',
     'ROC-000007', NULL, NULL, 'drug', 3.8, 'Drug and consumable distributor to government facilities'),
    ('SUP-PHARMA-MEDIL', 'Mediliance Sdn Bhd', 'Tender & Contract Team', '+60-3-0000-0005', 'tender@mediliance.com', '+60-3-0000-0005',
     'Kuala Lumpur, Malaysia',
     'ROC-000008', NULL, NULL, 'both', 4.0, 'Panel supplier for selected APPL and MOF items'),
    ('SUP-PHARMA-QR', 'Quality Reputation Sdn Bhd', 'Account Manager', '+60-3-0000-0006', 'info@qualityreputation.com', '+60-3-0000-0006',
     'Selangor, Malaysia',
     'ROC-000009', NULL, NULL, 'both', 3.9, 'Supplier of pharmaceuticals and selected non-drug consumables'),

    -- Non-drug / medical device / oxygen suppliers
    ('SUP-ND-HOSPITECH', 'Hospitech Resources Sdn Bhd', 'Hospital Sales', '+60-3-0000-0010', 'sales@hospitech.com.my', '+60-3-0000-0010',
     'Selangor, Malaysia',
     'ROC-000010', NULL, NULL, 'non_drug', 4.1, 'Medical devices, consumables and ward equipment'),
    ('SUP-ND-AUREU', 'Aureumeux Sdn Bhd', 'Product Specialist', '+60-3-0000-0011', 'info@aureumeux.com', '+60-3-0000-0011',
     'Kuala Lumpur, Malaysia',
     'ROC-000011', NULL, NULL, 'non_drug', 3.8, 'Medical consumables and devices supplier'),
    ('SUP-ND-TEEPHAM', 'Teepham Medical Sdn Bhd', 'Sales Manager', '+60-3-0000-0012', 'sales@teepham.com', '+60-3-0000-0012',
     'Penang, Malaysia',
     'ROC-000012', NULL, NULL, 'non_drug', 3.9, 'Supplier of medical and surgical instruments'),
    ('SUP-ND-SMHEALTH', 'SM Health Care Sdn Bhd', 'Key Account Manager', '+60-3-0000-0013', 'info@smhealth.com.my', '+60-3-0000-0013',
     'Selangor, Malaysia',
     'ROC-000013', NULL, NULL, 'non_drug', 4.0, 'Surgical and ward consumables supplier'),
    ('SUP-ND-VONIC', 'Vonic Healthcare Sdn Bhd', 'Customer Service', '+60-3-0000-0014', 'info@vonic.com.my', '+60-3-0000-0014',
     'Selangor, Malaysia',
     'ROC-000014', NULL, NULL, 'non_drug', 3.8, 'Medical devices and rehabilitation equipment'),
    ('SUP-ND-LINDE', 'Linde Malaysia Sdn Bhd (Medical Oxygen)', 'Healthcare Segment', '+60-3-0000-0020', 'healthcare.my@linde.com', '+60-3-0000-0020',
     'Petaling Jaya, Selangor, Malaysia',
     'ROC-000015', NULL, NULL, 'non_drug', 4.5, 'Bulk and cylinder medical oxygen supplier'),
    ('SUP-ND-PRIMABUMI', 'Primabumi Sdn Bhd', 'Operations Manager', '+60-3-0000-0021', 'info@primabumi.com', '+60-3-0000-0021',
     'Selangor, Malaysia',
     'ROC-000016', NULL, NULL, 'non_drug', 3.9, 'Supplier of consumables and minor medical equipment'),
    ('SUP-ND-FUSION', 'Fusion Medic Sdn Bhd', 'Sales & Marketing', '+60-3-0000-0022', 'info@fusionmedic.com', '+60-3-0000-0022',
     'Kuala Lumpur, Malaysia',
     'ROC-000017', NULL, NULL, 'non_drug', 3.9, 'Diagnostic and clinical equipment supplier'),
    ('SUP-ND-MEDISARB', 'Medisarb Sdn Bhd', 'Product Specialist', '+60-3-0000-0023', 'info@medisarb.com', '+60-3-0000-0023',
     'Klang Valley, Malaysia',
     'ROC-000018', NULL, NULL, 'non_drug', 3.8, 'Non-drug medical consumables and equipment')
) AS s (
  supplier_code,
  company_name,
  contact_person,
  contact_person_phone,
  email,
  phone,
  address,
  registration_number,
  bank_account,
  bank_name,
  supplier_type,
  performance_rating,
  notes
)
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers existing
  WHERE existing.company_name = s.company_name
);


