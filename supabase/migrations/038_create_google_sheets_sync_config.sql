-- Migration: Create Google Sheets Sync Config Table
-- Description: Creates the table to store Google Sheets synchronization configuration

-- 1. Create the table
CREATE TABLE IF NOT EXISTS google_sheets_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  sheet_id TEXT NOT NULL,
  sheet_name TEXT DEFAULT 'Sheet1',
  range TEXT,
  sync_type TEXT DEFAULT 'contracts' CHECK (sync_type IN ('contracts', 'other')),
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 60 CHECK (sync_interval_minutes >= 5 AND sync_interval_minutes <= 1440),
  api_key TEXT, -- Store securely (consider encryption in production)
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'in_progress')),
  last_sync_error TEXT,
  detected_headers JSONB, -- Array of detected column headers from the sheet
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, sync_type) -- One sync config per hospital per sync type
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_google_sheets_sync_config_hospital_id ON google_sheets_sync_config(hospital_id);
CREATE INDEX IF NOT EXISTS idx_google_sheets_sync_config_sync_type ON google_sheets_sync_config(sync_type);
CREATE INDEX IF NOT EXISTS idx_google_sheets_sync_config_last_sync_at ON google_sheets_sync_config(last_sync_at DESC);

-- 3. Enable RLS
ALTER TABLE google_sheets_sync_config ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DO $$
BEGIN
  -- Policy: Users can view sync config for their hospital
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_sheets_sync_config' AND policyname = 'hospital_scoped_sync_config_select') THEN
    CREATE POLICY hospital_scoped_sync_config_select ON google_sheets_sync_config
      FOR SELECT USING (
        hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
      );
  END IF;

  -- Policy: Users can insert sync config for their hospital
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_sheets_sync_config' AND policyname = 'hospital_scoped_sync_config_insert') THEN
    CREATE POLICY hospital_scoped_sync_config_insert ON google_sheets_sync_config
      FOR INSERT WITH CHECK (
        hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
      );
  END IF;

  -- Policy: Users can update sync config for their hospital
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_sheets_sync_config' AND policyname = 'hospital_scoped_sync_config_update') THEN
    CREATE POLICY hospital_scoped_sync_config_update ON google_sheets_sync_config
      FOR UPDATE USING (
        hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
      );
  END IF;

  -- Policy: Users can delete sync config for their hospital
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_sheets_sync_config' AND policyname = 'hospital_scoped_sync_config_delete') THEN
    CREATE POLICY hospital_scoped_sync_config_delete ON google_sheets_sync_config
      FOR DELETE USING (
        hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
      );
  END IF;
END $$;

-- 5. Create trigger for updated_at
CREATE TRIGGER update_google_sheets_sync_config_updated_at
  BEFORE UPDATE ON google_sheets_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Add Comments
COMMENT ON TABLE google_sheets_sync_config IS 'Stores Google Sheets synchronization configuration for each hospital';
COMMENT ON COLUMN google_sheets_sync_config.sheet_id IS 'Google Sheet ID extracted from URL';
COMMENT ON COLUMN google_sheets_sync_config.sheet_name IS 'Name of the worksheet tab (default: Sheet1)';
COMMENT ON COLUMN google_sheets_sync_config.range IS 'Optional range to sync (e.g., A1:Z1000)';
COMMENT ON COLUMN google_sheets_sync_config.api_key IS 'Optional Google Sheets API key for private sheets';
COMMENT ON COLUMN google_sheets_sync_config.detected_headers IS 'Array of detected column headers from the Google Sheet (for dynamic table rendering)';
COMMENT ON COLUMN google_sheets_sync_config.sync_interval_minutes IS 'Auto-sync interval in minutes (minimum: 5, maximum: 1440)';
