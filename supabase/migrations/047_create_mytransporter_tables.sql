-- Migration: Create MyTransporter Tables (transport_vehicles, transport_requests, vehicle_inspections, vehicle_issue_reports, transport_request_logs)
-- Part of MyTransporter Integrated Transport and Ambulance Management Submodule

-- ============================================
-- 1. Create transport_vehicles Table
-- ============================================
CREATE TABLE IF NOT EXISTS transport_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_kenderaan TEXT NOT NULL,
  no_chasis TEXT NOT NULL,
  jenis_kenderaan TEXT NOT NULL CHECK (jenis_kenderaan IN ('ambulance', 'sg')),
  model TEXT NOT NULL,
  tarikh_tamat_cukai_jalan DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_transport_vehicles_no_kenderaan UNIQUE (no_kenderaan, hospital_id),
  CONSTRAINT uq_transport_vehicles_no_chasis UNIQUE (no_chasis, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_hospital_id ON transport_vehicles(hospital_id);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_status ON transport_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_jenis ON transport_vehicles(jenis_kenderaan);

-- ============================================
-- 2. Create transport_requests Table
-- ============================================
CREATE TABLE IF NOT EXISTS transport_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_rujukan TEXT NOT NULL,
  jenis_permohonan TEXT NOT NULL CHECK (jenis_permohonan IN ('ambulance', 'sg')),
  tujuan_permohonan TEXT NOT NULL,
  destinasi TEXT NOT NULL,
  tarikh_masa_diperlukan TIMESTAMP WITH TIME ZONE NOT NULL,
  unit_pemohon TEXT NOT NULL,
  pengiring TEXT CHECK (pengiring IN ('nurse', 'medical_officer', 'assistant_medical_officer', 'ppk')),
  bawa_pesakit BOOLEAN NOT NULL DEFAULT false,
  
  -- Patient details
  nama_pesakit TEXT,
  rn_pesakit TEXT,
  jantina_pesakit TEXT CHECK (jantina_pesakit IN ('M', 'F', 'Lelaki', 'Perempuan')),
  diagnosis_pesakit TEXT,
  telefon_pesakit TEXT,
  
  catatan_khas TEXT,
  oksigen_diperlukan BOOLEAN DEFAULT false,
  status_semasa TEXT NOT NULL DEFAULT 'draft' CHECK (status_semasa IN ('draft', 'submitted', 'driver_accepted', 'driver_rejected', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled')),
  sebab_tolak TEXT,
  
  pemohon_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pemandu_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pelulus_id UUID REFERENCES users(id) ON DELETE SET NULL,
  kenderaan_id UUID REFERENCES transport_vehicles(id) ON DELETE SET NULL,
  
  driver_accepted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  trip_started_at TIMESTAMP WITH TIME ZONE,
  trip_completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_transport_requests_no_rujukan UNIQUE (no_rujukan, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_transport_requests_hospital_id ON transport_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_status ON transport_requests(status_semasa);
CREATE INDEX IF NOT EXISTS idx_transport_requests_pemohon_id ON transport_requests(pemohon_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_pemandu_id ON transport_requests(pemandu_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_kenderaan_id ON transport_requests(kenderaan_id);

-- ============================================
-- 3. Create vehicle_inspections Table
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES transport_requests(id) ON DELETE CASCADE,
  kenderaan_id UUID NOT NULL REFERENCES transport_vehicles(id) ON DELETE CASCADE,
  pemandu_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  jenis_pemeriksaan TEXT NOT NULL CHECK (jenis_pemeriksaan IN ('pre_trip', 'post_trip')),
  status_tayar TEXT NOT NULL CHECK (status_tayar IN ('good', 'issue')),
  foto_tayar TEXT,
  status_minyak_gas TEXT NOT NULL CHECK (status_minyak_gas IN ('good', 'issue')),
  foto_minyak_gas TEXT,
  status_minyak_hitam TEXT NOT NULL CHECK (status_minyak_hitam IN ('good', 'issue')),
  foto_minyak_hitam TEXT,
  bacaan_odometer INTEGER NOT NULL,
  foto_odometer TEXT,
  keputusan TEXT NOT NULL CHECK (keputusan IN ('cleared', 'rejected')),
  catatan TEXT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_request_id ON vehicle_inspections(request_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_kenderaan_id ON vehicle_inspections(kenderaan_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_hospital_id ON vehicle_inspections(hospital_id);

-- ============================================
-- 4. Create vehicle_issue_reports Table
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kenderaan_id UUID NOT NULL REFERENCES transport_vehicles(id) ON DELETE CASCADE,
  pemandu_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  inspection_id UUID REFERENCES vehicle_inspections(id) ON DELETE SET NULL,
  tajuk TEXT NOT NULL,
  penerangan TEXT NOT NULL,
  keutamaan TEXT NOT NULL DEFAULT 'medium' CHECK (keutamaan IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  catatan_penyelesaian TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_issue_reports_kenderaan_id ON vehicle_issue_reports(kenderaan_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_issue_reports_status ON vehicle_issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_issue_reports_hospital_id ON vehicle_issue_reports(hospital_id);

-- ============================================
-- 5. Create transport_request_logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS transport_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES transport_requests(id) ON DELETE CASCADE,
  tindakan TEXT NOT NULL,
  status_sebelum TEXT NOT NULL,
  status_selepas TEXT NOT NULL,
  catatan TEXT,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_request_logs_request_id ON transport_request_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_transport_request_logs_hospital_id ON transport_request_logs(hospital_id);

-- ============================================
-- 6. Add Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_transport_vehicles_updated_at ON transport_vehicles;
CREATE TRIGGER update_transport_vehicles_updated_at
  BEFORE UPDATE ON transport_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transport_requests_updated_at ON transport_requests;
CREATE TRIGGER update_transport_requests_updated_at
  BEFORE UPDATE ON transport_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_issue_reports_updated_at ON vehicle_issue_reports;
CREATE TRIGGER update_vehicle_issue_reports_updated_at
  BEFORE UPDATE ON vehicle_issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_request_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 transport_vehicles Policies
CREATE POLICY "Users view vehicles in their hospital"
  ON transport_vehicles FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert vehicles in their hospital"
  ON transport_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update vehicles in their hospital"
  ON transport_vehicles FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users delete vehicles in their hospital"
  ON transport_vehicles FOR DELETE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 7.2 transport_requests Policies
CREATE POLICY "Users view requests in their hospital"
  ON transport_requests FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert requests in their hospital"
  ON transport_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update requests in their hospital"
  ON transport_requests FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 7.3 vehicle_inspections Policies
CREATE POLICY "Users view inspections in their hospital"
  ON vehicle_inspections FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert inspections in their hospital"
  ON vehicle_inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 7.4 vehicle_issue_reports Policies
CREATE POLICY "Users view issues in their hospital"
  ON vehicle_issue_reports FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert issues in their hospital"
  ON vehicle_issue_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users update issues in their hospital"
  ON vehicle_issue_reports FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- 7.5 transport_request_logs Policies
CREATE POLICY "Users view logs in their hospital"
  ON transport_request_logs FOR SELECT
  TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users insert logs in their hospital"
  ON transport_request_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (SELECT hospital_id FROM users WHERE users.id = auth.uid())
  );

-- ============================================
-- 8. Try to create storage bucket policies
-- ============================================
DO $$
BEGIN
  CREATE POLICY "Public can read transport photos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'transport-inspections');

  CREATE POLICY "Drivers can upload transport photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'transport-inspections'
    );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Cannot create storage policies for transport-inspections. Please create the bucket and policies manually if needed.';
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating storage policies: %', SQLERRM;
END $$;

-- ============================================
-- 9. Comments for documentation
-- ============================================
COMMENT ON TABLE transport_vehicles IS 'Daftar kenderaan hospital (ambulans dan kereta jabatan)';
COMMENT ON TABLE transport_requests IS 'Rekod permohonan pengangkutan ambulans dan kereta jabatan';
COMMENT ON TABLE vehicle_inspections IS 'Rekod pemeriksaan kenderaan pre-trip dan post-trip oleh pemandu';
COMMENT ON TABLE vehicle_issue_reports IS 'Laporan kerosakan/isu kenderaan yang dibuat oleh pemandu';
COMMENT ON TABLE transport_request_logs IS 'Log audit perubahan status permohonan pengangkutan';
