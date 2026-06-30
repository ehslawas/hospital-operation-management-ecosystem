-- Migration: Create MySuhu Tables (lokasi, unit_pemantauan, ambang_suhu, bacaan_suhu)
-- Part of MySuhu Temperature Monitoring Submodule

-- ============================================
-- 1. Create lokasi Table
-- ============================================
CREATE TABLE IF NOT EXISTS lokasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kod_lokasi TEXT NOT NULL UNIQUE,
  nama_lokasi TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  deskripsi TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lokasi_hospital_id ON lokasi(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lokasi_status ON lokasi(status);
CREATE INDEX IF NOT EXISTS idx_lokasi_kod ON lokasi(kod_lokasi);

-- ============================================
-- 2. Create unit_pemantauan Table
-- ============================================
CREATE TABLE IF NOT EXISTS unit_pemantauan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lokasi_id UUID NOT NULL REFERENCES lokasi(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL UNIQUE,
  nama_unit TEXT NOT NULL,
  jenis_unit TEXT NOT NULL CHECK (jenis_unit IN ('freezer', 'refrigerator', 'ambient', 'incubator', 'other')),
  nota TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unit_pemantauan_lokasi_id ON unit_pemantauan(lokasi_id);
CREATE INDEX IF NOT EXISTS idx_unit_pemantauan_status ON unit_pemantauan(status);
CREATE INDEX IF NOT EXISTS idx_unit_pemantauan_id ON unit_pemantauan(unit_id);

-- ============================================
-- 3. Create ambang_suhu Table
-- ============================================
CREATE TABLE IF NOT EXISTS ambang_suhu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES unit_pemantauan(id) ON DELETE CASCADE,
  min_suhu DECIMAL(5,2) NOT NULL,
  max_suhu DECIMAL(5,2) NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_temp_range CHECK (min_suhu < max_suhu)
);

CREATE INDEX IF NOT EXISTS idx_ambang_suhu_unit_id ON ambang_suhu(unit_id);
CREATE INDEX IF NOT EXISTS idx_ambang_suhu_effective ON ambang_suhu(effective_from, effective_until);

-- ============================================
-- 4. Create bacaan_suhu Table
-- ============================================
CREATE TABLE IF NOT EXISTS bacaan_suhu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES unit_pemantauan(id) ON DELETE CASCADE,
  suhu DECIMAL(5,2) NOT NULL,
  status_bacaan TEXT NOT NULL CHECK (status_bacaan IN ('normal', 'warning', 'breach')),
  ambang_id UUID NOT NULL REFERENCES ambang_suhu(id) ON DELETE RESTRICT,
  tarikh_masa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  dicatat_pada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  dicatat_oleh UUID REFERENCES users(id) ON DELETE SET NULL,
  nota TEXT,
  is_corrected BOOLEAN NOT NULL DEFAULT false,
  correction_note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bacaan_suhu_unit_id ON bacaan_suhu(unit_id);
CREATE INDEX IF NOT EXISTS idx_bacaan_suhu_tarikh ON bacaan_suhu(tarikh_masa DESC);
CREATE INDEX IF NOT EXISTS idx_bacaan_suhu_status ON bacaan_suhu(status_bacaan);

-- ============================================
-- 5. Add Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_lokasi_updated_at ON lokasi;
CREATE TRIGGER update_lokasi_updated_at
  BEFORE UPDATE ON lokasi
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unit_pemantauan_updated_at ON unit_pemantauan;
CREATE TRIGGER update_unit_pemantauan_updated_at
  BEFORE UPDATE ON unit_pemantauan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bacaan_suhu_updated_at ON bacaan_suhu;
CREATE TRIGGER update_bacaan_suhu_updated_at
  BEFORE UPDATE ON bacaan_suhu
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE lokasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_pemantauan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambang_suhu ENABLE ROW LEVEL SECURITY;
ALTER TABLE bacaan_suhu ENABLE ROW LEVEL SECURITY;

-- 6.1 lokasi Policies
CREATE POLICY "Users view locations in their hospital"
  ON lokasi FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert locations in their hospital"
  ON lokasi FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update locations in their hospital"
  ON lokasi FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 6.2 unit_pemantauan Policies
CREATE POLICY "Users view units in their hospital"
  ON unit_pemantauan FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lokasi
      WHERE lokasi.id = unit_pemantauan.lokasi_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users insert units in their hospital"
  ON unit_pemantauan FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lokasi
      WHERE lokasi.id = unit_pemantauan.lokasi_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users update units in their hospital"
  ON unit_pemantauan FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lokasi
      WHERE lokasi.id = unit_pemantauan.lokasi_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lokasi
      WHERE lokasi.id = unit_pemantauan.lokasi_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

-- 6.3 ambang_suhu Policies
CREATE POLICY "Users view thresholds in their hospital"
  ON ambang_suhu FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = ambang_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users insert thresholds in their hospital"
  ON ambang_suhu FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = ambang_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users update thresholds in their hospital"
  ON ambang_suhu FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = ambang_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = ambang_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

-- 6.4 bacaan_suhu Policies
CREATE POLICY "Users view readings in their hospital"
  ON bacaan_suhu FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = bacaan_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users insert readings in their hospital"
  ON bacaan_suhu FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = bacaan_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

CREATE POLICY "Users update readings in their hospital"
  ON bacaan_suhu FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = bacaan_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_pemantauan
      JOIN lokasi ON lokasi.id = unit_pemantauan.lokasi_id
      WHERE unit_pemantauan.id = bacaan_suhu.unit_id
        AND lokasi.hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
    )
  );

-- ============================================
-- 7. Comments for documentation
-- ============================================
COMMENT ON TABLE lokasi IS 'Physical locations within hospitals, e.g. Pharmacy Logistics';
COMMENT ON TABLE unit_pemantauan IS 'Devices or points monitored within a location, e.g. Refrigerator 1';
COMMENT ON TABLE ambang_suhu IS 'Historical and active temperature thresholds for a unit';
COMMENT ON TABLE bacaan_suhu IS 'Logged temperature readings with snapshot reference to active threshold';
