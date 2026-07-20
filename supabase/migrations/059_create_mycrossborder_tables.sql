-- Migration: Create MyCrossBorder Tables (crossborder_transfers, crossborder_patients, crossborder_escorts)
-- Part of Malaysia-Brunei Cross Border Patient Transfer System

-- ============================================
-- 1. Create crossborder_transfers Table
-- ============================================
CREATE TABLE IF NOT EXISTS crossborder_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_rujukan TEXT UNIQUE NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  referring_hospital TEXT NOT NULL DEFAULT 'Hospital Lawas',
  destination_hospital TEXT NOT NULL DEFAULT 'Hospital Limbang',
  tarikh_perjalanan DATE NOT NULL,
  masa_berlepas TIME NOT NULL,
  tempat_berlepas TEXT NOT NULL DEFAULT 'Hospital Lawas',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'completed', 'cancelled')),
  
  -- Vehicle Details
  jenis_kenderaan TEXT NOT NULL DEFAULT 'ambulance' CHECK (jenis_kenderaan IN ('ambulance', 'government_vehicle')),
  no_pendaftaran TEXT NOT NULL,
  peralatan_lain TEXT,
  pemandu_nama TEXT,
  pemandu_passport TEXT,
  
  -- Referring Doctor
  doktor_perujuk_nama TEXT NOT NULL,
  doktor_perujuk_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Approval details
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  pengarah_nama TEXT,
  
  -- Border Control
  border_control_post TEXT NOT NULL DEFAULT 'MALAYSIA/BRUNEI',
  surat_kebenaran_ref TEXT,
  
  -- Audit / Control
  catatan TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crossborder_transfers_hospital_id ON crossborder_transfers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_crossborder_transfers_status ON crossborder_transfers(status);
CREATE INDEX IF NOT EXISTS idx_crossborder_transfers_no_rujukan ON crossborder_transfers(no_rujukan);
CREATE INDEX IF NOT EXISTS idx_crossborder_transfers_tarikh ON crossborder_transfers(tarikh_perjalanan DESC);

-- ============================================
-- 2. Create crossborder_patients Table
-- ============================================
CREATE TABLE IF NOT EXISTS crossborder_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES crossborder_transfers(id) ON DELETE CASCADE,
  urutan INTEGER NOT NULL CHECK (urutan BETWEEN 1 AND 3),
  nama TEXT NOT NULL,
  jantina TEXT NOT NULL CHECK (jantina IN ('Lelaki', 'Perempuan')),
  tarikh_lahir DATE NOT NULL,
  warganegara TEXT NOT NULL DEFAULT 'Malaysia',
  jenis_dokumen TEXT NOT NULL DEFAULT 'PASSPORT' CHECK (jenis_dokumen IN ('PASSPORT', 'IC', 'OTHERS')),
  no_dokumen TEXT NOT NULL,
  no_pengenalan TEXT, -- Optional IC or secondary registration
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Prevent multiple entries of same patient order per transfer
  UNIQUE (transfer_id, urutan)
);

CREATE INDEX IF NOT EXISTS idx_crossborder_patients_transfer_id ON crossborder_patients(transfer_id);
CREATE INDEX IF NOT EXISTS idx_crossborder_patients_hospital_id ON crossborder_patients(hospital_id);

-- ============================================
-- 3. Create crossborder_escorts Table
-- ============================================
CREATE TABLE IF NOT EXISTS crossborder_escorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES crossborder_transfers(id) ON DELETE CASCADE,
  jenis_pengiring TEXT NOT NULL CHECK (jenis_pengiring IN ('patient_escort', 'medical_escort')),
  nama TEXT NOT NULL,
  jenis_dokumen TEXT NOT NULL DEFAULT 'PASSPORT' CHECK (jenis_dokumen IN ('PASSPORT', 'IC', 'OTHERS')),
  no_dokumen TEXT NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crossborder_escorts_transfer_id ON crossborder_escorts(transfer_id);
CREATE INDEX IF NOT EXISTS idx_crossborder_escorts_hospital_id ON crossborder_escorts(hospital_id);

-- ============================================
-- 4. Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_crossborder_transfers_updated_at ON crossborder_transfers;
CREATE TRIGGER update_crossborder_transfers_updated_at
  BEFORE UPDATE ON crossborder_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crossborder_patients_updated_at ON crossborder_patients;
CREATE TRIGGER update_crossborder_patients_updated_at
  BEFORE UPDATE ON crossborder_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE crossborder_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossborder_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossborder_escorts ENABLE ROW LEVEL SECURITY;

-- 5.1 crossborder_transfers policies
CREATE POLICY "Users view crossborder transfers in their hospital"
  ON crossborder_transfers FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert crossborder transfers in their hospital"
  ON crossborder_transfers FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update crossborder transfers in their hospital"
  ON crossborder_transfers FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users delete crossborder transfers in their hospital"
  ON crossborder_transfers FOR DELETE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 5.2 crossborder_patients policies
CREATE POLICY "Users view crossborder patients in their hospital"
  ON crossborder_patients FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert crossborder patients in their hospital"
  ON crossborder_patients FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update crossborder patients in their hospital"
  ON crossborder_patients FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 5.3 crossborder_escorts policies
CREATE POLICY "Users view crossborder escorts in their hospital"
  ON crossborder_escorts FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert crossborder escorts in their hospital"
  ON crossborder_escorts FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- ============================================
-- 6. Comments for documentation
-- ============================================
COMMENT ON TABLE crossborder_transfers IS 'Master rekod permohonan rentasi sempadan Malaysia-Brunei bagi pemindahan pesakit';
COMMENT ON TABLE crossborder_patients IS 'Rekod maklumat pesakit (maksima 3) yang dipindahkan dalam permohonan rentasi sempadan';
COMMENT ON TABLE crossborder_escorts IS 'Rekod maklumat pengiring pesakit dan pengiring perubatan (KKM) dalam pemindahan';
