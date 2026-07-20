-- Migration: Create MyPHiS Tables (myphis_disk_changes, myphis_navigation_logs)
-- Part of MyPHiS Integration Hub Submodule

-- ============================================
-- 1. Create myphis_disk_changes Table
-- ============================================
CREATE TABLE IF NOT EXISTS myphis_disk_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarikh DATE NOT NULL,
  waktu TIME NOT NULL,
  disk_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
  petugas_nama TEXT NOT NULL,
  dicatat_oleh UUID REFERENCES users(id) ON DELETE SET NULL,
  nota TEXT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_myphis_disk_changes_date_hosp UNIQUE (tarikh, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_myphis_disk_changes_hosp ON myphis_disk_changes(hospital_id);
CREATE INDEX IF NOT EXISTS idx_myphis_disk_changes_tarikh ON myphis_disk_changes(tarikh DESC);

-- ============================================
-- 2. Create myphis_navigation_logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS myphis_navigation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarikh_masa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  destination_url TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  petugas_nama TEXT NOT NULL,
  dicatat_oleh UUID REFERENCES users(id) ON DELETE SET NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_myphis_nav_logs_hosp ON myphis_navigation_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_myphis_nav_logs_tarikh ON myphis_navigation_logs(tarikh_masa DESC);

-- ============================================
-- 3. Add Trigger for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_myphis_disk_changes_updated_at ON myphis_disk_changes;
CREATE TRIGGER update_myphis_disk_changes_updated_at
  BEFORE UPDATE ON myphis_disk_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE myphis_disk_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE myphis_navigation_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 myphis_disk_changes Policies
CREATE POLICY "Users view disk changes in their hospital"
  ON myphis_disk_changes FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert disk changes in their hospital"
  ON myphis_disk_changes FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update disk changes in their hospital"
  ON myphis_disk_changes FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 4.2 myphis_navigation_logs Policies
CREATE POLICY "Users view navigation logs in their hospital"
  ON myphis_navigation_logs FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert navigation logs in their hospital"
  ON myphis_navigation_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- ============================================
-- 5. Comments for documentation
-- ============================================
COMMENT ON TABLE myphis_disk_changes IS 'Logs of daily PHiS server backup disk/tape rotation swaps';
COMMENT ON TABLE myphis_navigation_logs IS 'Audit logs of navigation clicks to external PHiS systems';
