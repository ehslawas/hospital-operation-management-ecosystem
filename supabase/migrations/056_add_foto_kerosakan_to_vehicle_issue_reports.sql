-- Migration: Add foto_kerosakan to vehicle_issue_reports
ALTER TABLE vehicle_issue_reports ADD COLUMN IF NOT EXISTS foto_kerosakan TEXT;
