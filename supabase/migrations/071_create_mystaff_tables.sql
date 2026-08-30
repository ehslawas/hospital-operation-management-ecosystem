-- ====================================================================================
-- Migration: 071_create_mystaff_tables.sql
-- Module: MyStaff - Enterprise Staff Movement, Leave & Reminder Ecosystem
-- ====================================================================================

-- 1. Create staff_leave_types table
CREATE TABLE IF NOT EXISTS staff_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  kod_cuti TEXT NOT NULL,
  nama_cuti TEXT NOT NULL,
  nama_cuti_en TEXT NOT NULL,
  max_hari_setahun INTEGER,
  require_sijil BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT true,
  kategori TEXT NOT NULL CHECK (kategori IN ('biasa', 'perubatan', 'khas', 'gantian', 'lain')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, kod_cuti)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_types_hospital_id ON staff_leave_types(hospital_id);

-- 2. Create staff_leave_quotas table
CREATE TABLE IF NOT EXISTS staff_leave_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES staff_leave_types(id) ON DELETE CASCADE,
  tahun INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  hak_hari NUMERIC(5,1) NOT NULL DEFAULT 0,
  digunakan_hari NUMERIC(5,1) NOT NULL DEFAULT 0,
  baki_hari NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, leave_type_id, tahun)
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_quotas_user_id ON staff_leave_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_quotas_hospital_id ON staff_leave_quotas(hospital_id);

-- 3. Create staff_leave_applications table
CREATE TABLE IF NOT EXISTS staff_leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES staff_leave_types(id) ON DELETE RESTRICT,
  tarikh_mula DATE NOT NULL,
  tarikh_tamat DATE NOT NULL,
  jumlah_hari NUMERIC(4,1) NOT NULL DEFAULT 1,
  sesi TEXT NOT NULL DEFAULT 'full' CHECK (sesi IN ('full', 'am', 'pm')),
  sebab TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  catatan_pelulus TEXT,
  attachment_url TEXT,
  is_half_day BOOLEAN NOT NULL DEFAULT false,
  half_day_session TEXT CHECK (half_day_session IN ('am', 'pm')),
  replacement_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_user_id ON staff_leave_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_hospital_id ON staff_leave_applications(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_department_id ON staff_leave_applications(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_status ON staff_leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_staff_leave_apps_dates ON staff_leave_applications(tarikh_mula, tarikh_tamat);

-- 4. Create staff_movements table (Pergerakan Pegawai / Keluar Pejabat)
CREATE TABLE IF NOT EXISTS staff_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  jenis_pergerakan TEXT NOT NULL CHECK (jenis_pergerakan IN (
    'MEETING', 'COURSE', 'CME', 'PRESENTATION',
    'SITE_VISIT', 'OFFICIAL_DUTY', 'SPECIAL_DUTY',
    'FIELDWORK', 'HOSPITAL_REP', 'OTHER'
  )),
  tajuk TEXT NOT NULL,
  destination TEXT NOT NULL,
  tarikh_mula DATE NOT NULL,
  masa_keluar TIME,
  tarikh_tamat DATE NOT NULL,
  masa_balik TIME,
  tujuan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  catatan TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_movements_user_id ON staff_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_movements_hospital_id ON staff_movements(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_movements_department_id ON staff_movements(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_movements_dates ON staff_movements(tarikh_mula, tarikh_tamat);
CREATE INDEX IF NOT EXISTS idx_staff_movements_jenis ON staff_movements(jenis_pergerakan);

-- 5. Create staff_reminders table
CREATE TABLE IF NOT EXISTS staff_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  tajuk TEXT NOT NULL,
  penerangan TEXT,
  jenis_peringatan TEXT NOT NULL DEFAULT 'other' CHECK (jenis_peringatan IN (
    'meeting', 'cme', 'course', 'deadline', 'submission', 'other'
  )),
  tarikh_peringatan TIMESTAMP WITH TIME ZONE NOT NULL,
  remind_before_minutes INTEGER NOT NULL DEFAULT 60,
  is_shared_dept BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_reminders_user_id ON staff_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_reminders_hospital_id ON staff_reminders(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_reminders_dept ON staff_reminders(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_reminders_due ON staff_reminders(tarikh_peringatan);

-- 6. Create staff_deadlines table
CREATE TABLE IF NOT EXISTS staff_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  tajuk TEXT NOT NULL,
  penerangan TEXT,
  kategori TEXT NOT NULL DEFAULT 'laporan' CHECK (kategori IN (
    'laporan', 'anggaran', 'penyerahan', 'audit', 'lain'
  )),
  tarikh_akhir DATE NOT NULL,
  keutamaan TEXT NOT NULL DEFAULT 'medium' CHECK (keutamaan IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'overdue')),
  is_shared_dept BOOLEAN NOT NULL DEFAULT true,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_deadlines_dept ON staff_deadlines(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_deadlines_hospital_id ON staff_deadlines(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_deadlines_tarikh_akhir ON staff_deadlines(tarikh_akhir);
CREATE INDEX IF NOT EXISTS idx_staff_deadlines_status ON staff_deadlines(status);

-- 7. Auto-update triggers
DROP TRIGGER IF EXISTS update_staff_leave_types_updated_at ON staff_leave_types;
CREATE TRIGGER update_staff_leave_types_updated_at
  BEFORE UPDATE ON staff_leave_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_leave_quotas_updated_at ON staff_leave_quotas;
CREATE TRIGGER update_staff_leave_quotas_updated_at
  BEFORE UPDATE ON staff_leave_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_leave_applications_updated_at ON staff_leave_applications;
CREATE TRIGGER update_staff_leave_applications_updated_at
  BEFORE UPDATE ON staff_leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_movements_updated_at ON staff_movements;
CREATE TRIGGER update_staff_movements_updated_at
  BEFORE UPDATE ON staff_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_reminders_updated_at ON staff_reminders;
CREATE TRIGGER update_staff_reminders_updated_at
  BEFORE UPDATE ON staff_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_deadlines_updated_at ON staff_deadlines;
CREATE TRIGGER update_staff_deadlines_updated_at
  BEFORE UPDATE ON staff_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS)
ALTER TABLE staff_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leave_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_deadlines ENABLE ROW LEVEL SECURITY;

-- 8.1 staff_leave_types RLS
CREATE POLICY "Users view leave types in hospital" ON staff_leave_types
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users insert leave types in hospital" ON staff_leave_types
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users update leave types in hospital" ON staff_leave_types
  FOR UPDATE TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.2 staff_leave_quotas RLS
CREATE POLICY "Users view leave quotas in hospital" ON staff_leave_quotas
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage leave quotas in hospital" ON staff_leave_quotas
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.3 staff_leave_applications RLS
CREATE POLICY "Users view leave applications in hospital" ON staff_leave_applications
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage own leave applications" ON staff_leave_applications
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.4 staff_movements RLS
CREATE POLICY "Users view movements in hospital" ON staff_movements
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage movements in hospital" ON staff_movements
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.5 staff_reminders RLS
CREATE POLICY "Users view reminders in hospital" ON staff_reminders
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage reminders in hospital" ON staff_reminders
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 8.6 staff_deadlines RLS
CREATE POLICY "Users view deadlines in hospital" ON staff_deadlines
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Users manage deadlines in hospital" ON staff_deadlines
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid()));

-- 9. Seed default Malaysian civil service leave types for existing hospitals
DO $$
DECLARE
  h_rec RECORD;
BEGIN
  FOR h_rec IN SELECT id FROM hospitals LOOP
    INSERT INTO staff_leave_types (hospital_id, kod_cuti, nama_cuti, nama_cuti_en, max_hari_setahun, require_sijil, require_approval, kategori)
    VALUES
      (h_rec.id, 'CR', 'Cuti Rehat', 'Annual Leave', 25, false, true, 'biasa'),
      (h_rec.id, 'CS', 'Cuti Sakit', 'Medical Leave', 90, true, true, 'perubatan'),
      (h_rec.id, 'CM', 'Cuti Sakit Masuk Hospital', 'Hospitalisation Leave', 90, true, true, 'perubatan'),
      (h_rec.id, 'CB', 'Cuti Bersalin', 'Maternity Leave', 90, false, true, 'khas'),
      (h_rec.id, 'CP', 'Cuti Paterniti', 'Paternity Leave', 7, false, true, 'khas'),
      (h_rec.id, 'CK', 'Cuti Khas Kematian', 'Compassionate Leave', 3, false, true, 'khas'),
      (h_rec.id, 'CH', 'Cuti Haji', 'Haji Leave', 40, false, true, 'khas'),
      (h_rec.id, 'CG', 'Cuti Gantian', 'Replacement Leave', 14, false, true, 'gantian'),
      (h_rec.id, 'CTR', 'Cuti Tanpa Rekod', 'Unrecorded Leave', 3, false, true, 'biasa'),
      (h_rec.id, 'CSG', 'Cuti Separuh Gaji', 'Half-Pay Leave', 90, true, true, 'lain'),
      (h_rec.id, 'CTG', 'Cuti Tanpa Gaji', 'Unpaid Leave', NULL, false, true, 'lain')
    ON CONFLICT (hospital_id, kod_cuti) DO NOTHING;
  END LOOP;
END $$;
