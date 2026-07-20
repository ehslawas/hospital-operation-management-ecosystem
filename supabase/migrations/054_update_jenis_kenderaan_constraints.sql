-- Migration: Update check constraints for transport_vehicles and transport_requests to allow 'van_jenazah'

-- 1. Update check constraint on transport_vehicles table
ALTER TABLE transport_vehicles DROP CONSTRAINT IF EXISTS transport_vehicles_jenis_kenderaan_check;
ALTER TABLE transport_vehicles ADD CONSTRAINT transport_vehicles_jenis_kenderaan_check 
  CHECK (jenis_kenderaan IN ('ambulance', 'sg', 'van_jenazah'));

-- 2. Update check constraint on transport_requests table
ALTER TABLE transport_requests DROP CONSTRAINT IF EXISTS transport_requests_jenis_permohonan_check;
ALTER TABLE transport_requests ADD CONSTRAINT transport_requests_jenis_permohonan_check 
  CHECK (jenis_permohonan IN ('ambulance', 'sg', 'van_jenazah'));
