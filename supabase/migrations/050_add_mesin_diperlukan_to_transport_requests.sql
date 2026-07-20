-- Migration: Add mesin_diperlukan to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS mesin_diperlukan JSONB;
