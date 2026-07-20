-- Migration: Add medical_officer_referring to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS medical_officer_referring JSONB DEFAULT NULL;

COMMENT ON COLUMN transport_requests.medical_officer_referring IS 'Medical Officer Referring details ({name, department})';
