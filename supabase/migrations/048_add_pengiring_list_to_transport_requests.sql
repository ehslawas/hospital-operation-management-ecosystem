-- Migration: Add pengiring_list to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS pengiring_list JSONB;
