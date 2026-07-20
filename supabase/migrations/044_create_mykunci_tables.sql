-- Migration: Create MyKunci Tables (kunci_daftar, kunci_log, kunci_audit_bulanan)
-- Part of MyKunci Integrated Key Management Submodule

-- ============================================
-- 1. Create kunci_daftar Table
-- ============================================
CREATE TABLE IF NOT EXISTS kunci_daftar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kod_kunci TEXT NOT NULL UNIQUE,
  nama_kunci TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  lokasi_fizikal TEXT NOT NULL,
  jenis_kunci TEXT NOT NULL CHECK (jenis_kunci IN ('room', 'cabinet', 'cabinet_dda', 'vehicle', 'other')),
  tahap_kawalan TEXT NOT NULL DEFAULT 'normal' CHECK (tahap_kawalan IN ('normal', 'high')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'damaged', 'lost')),
  nombor_peti TEXT,
  status_sampul TEXT NOT NULL DEFAULT 'not_applicable' CHECK (status_sampul IN ('sealed', 'broken', 'not_applicable')),
  penjaga_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kunci_daftar_hospital_id ON kunci_daftar(hospital_id);
CREATE INDEX IF NOT EXISTS idx_kunci_daftar_department_id ON kunci_daftar(department_id);
CREATE INDEX IF NOT EXISTS idx_kunci_daftar_status ON kunci_daftar(status);
CREATE INDEX IF NOT EXISTS idx_kunci_daftar_kod ON kunci_daftar(kod_kunci);

-- ============================================
-- 2. Create kunci_log Table
-- ============================================
CREATE TABLE IF NOT EXISTS kunci_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunci_id UUID NOT NULL REFERENCES kunci_daftar(id) ON DELETE CASCADE,
  peminjam_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  pegawai_penyerah_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  pegawai_saksi_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tarikh_masa_ambil TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  jangka_masa_pulang TIMESTAMP WITH TIME ZONE NOT NULL,
  tarikh_masa_pulang TIMESTAMP WITH TIME ZONE,
  pegawai_penerima_id UUID REFERENCES users(id) ON DELETE SET NULL,
  keadaan_kunci TEXT CHECK (keadaan_kunci IN ('good', 'damaged')),
  keadaan_mangga TEXT CHECK (keadaan_mangga IN ('good', 'damaged', 'loose')),
  tujuan TEXT,
  catatan_penggunaan TEXT,
  duration_seconds INTEGER,
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kunci_log_kunci_id ON kunci_log(kunci_id);
CREATE INDEX IF NOT EXISTS idx_kunci_log_hospital_id ON kunci_log(hospital_id);
CREATE INDEX IF NOT EXISTS idx_kunci_log_ambil ON kunci_log(tarikh_masa_ambil DESC);
CREATE INDEX IF NOT EXISTS idx_kunci_log_pulang ON kunci_log(tarikh_masa_pulang DESC);

-- ============================================
-- 3. Create kunci_audit_bulanan Table
-- ============================================
CREATE TABLE IF NOT EXISTS kunci_audit_bulanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunci_id UUID NOT NULL REFERENCES kunci_daftar(id) ON DELETE CASCADE,
  tarikh_audit DATE NOT NULL DEFAULT CURRENT_DATE,
  auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  status_fizikal TEXT NOT NULL CHECK (status_fizikal IN ('present', 'missing', 'damaged')),
  sampul_bermeterai_utuh BOOLEAN NOT NULL DEFAULT true,
  catatan TEXT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kunci_audit_kunci_id ON kunci_audit_bulanan(kunci_id);
CREATE INDEX IF NOT EXISTS idx_kunci_audit_hospital_id ON kunci_audit_bulanan(hospital_id);
CREATE INDEX IF NOT EXISTS idx_kunci_audit_tarikh ON kunci_audit_bulanan(tarikh_audit DESC);

-- ============================================
-- 4. Add Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_kunci_daftar_updated_at ON kunci_daftar;
CREATE TRIGGER update_kunci_daftar_updated_at
  BEFORE UPDATE ON kunci_daftar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kunci_log_updated_at ON kunci_log;
CREATE TRIGGER update_kunci_log_updated_at
  BEFORE UPDATE ON kunci_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE kunci_daftar ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunci_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunci_audit_bulanan ENABLE ROW LEVEL SECURITY;

-- 5.1 kunci_daftar Policies
CREATE POLICY "Users view keys in their hospital"
  ON kunci_daftar FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert keys in their hospital"
  ON kunci_daftar FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update keys in their hospital"
  ON kunci_daftar FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users delete keys in their hospital"
  ON kunci_daftar FOR DELETE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 5.2 kunci_log Policies
CREATE POLICY "Users view key logs in their hospital"
  ON kunci_log FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert key logs in their hospital"
  ON kunci_log FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update key logs in their hospital"
  ON kunci_log FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 5.3 kunci_audit_bulanan Policies
CREATE POLICY "Users view audits in their hospital"
  ON kunci_audit_bulanan FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert audits in their hospital"
  ON kunci_audit_bulanan FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- ============================================
-- 6. Comments for documentation
-- ============================================
COMMENT ON TABLE kunci_daftar IS 'Daftar induk anak kunci fizikal mengikut jabatan di bawah polisi KKM';
COMMENT ON TABLE kunci_log IS 'Log pergerakan peminjaman dan pemulangan kunci fizikal';
COMMENT ON TABLE kunci_audit_bulanan IS 'Rekod pemeriksaan fizikal kunci bulanan dan integriti sampul meterai';
