-- Migration: Add nama_pemohon to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS nama_pemohon TEXT DEFAULT NULL;

COMMENT ON COLUMN transport_requests.nama_pemohon IS 'Nama kakitangan yang membuat permohonan dari unit/wad';
