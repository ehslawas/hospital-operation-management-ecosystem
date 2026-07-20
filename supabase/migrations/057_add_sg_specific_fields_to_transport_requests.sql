-- Migration: Add SG specific fields to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS tarikh_masa_sehingga TIMESTAMP WITH TIME ZONE;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS pemandu_diperlukan BOOLEAN DEFAULT true;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS senarai_penumpang JSONB;
