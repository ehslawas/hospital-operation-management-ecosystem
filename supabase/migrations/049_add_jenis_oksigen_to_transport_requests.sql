-- Migration: Add jenis_oksigen to transport_requests
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS jenis_oksigen TEXT;
