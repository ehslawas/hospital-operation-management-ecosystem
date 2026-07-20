-- Migration: Add patient_mobility to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS patient_mobility TEXT DEFAULT NULL CHECK (patient_mobility IN ('walking', 'wheelchair', 'stretcher'));

COMMENT ON COLUMN transport_requests.patient_mobility IS 'Patient mobility status (walking, wheelchair, stretcher)';
