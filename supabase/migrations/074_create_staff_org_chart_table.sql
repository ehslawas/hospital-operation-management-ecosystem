-- ====================================================================================
-- Migration: 074_create_staff_org_chart_table.sql
-- Module: MyStaff - Enterprise Organizational Chart Cloud Persistence & Realtime Sync
-- ====================================================================================

-- 1. Create staff_org_chart table
CREATE TABLE IF NOT EXISTS staff_org_chart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  chart_key TEXT NOT NULL DEFAULT 'main_org_chart',
  chart_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, chart_key)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_org_chart_hospital_id ON staff_org_chart(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_org_chart_chart_key ON staff_org_chart(chart_key);

-- 3. Auto-update trigger for updated_at
DROP TRIGGER IF EXISTS update_staff_org_chart_updated_at ON staff_org_chart;
CREATE TRIGGER update_staff_org_chart_updated_at
  BEFORE UPDATE ON staff_org_chart
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE staff_org_chart ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "allow_read_staff_org_chart" ON staff_org_chart;
CREATE POLICY "allow_read_staff_org_chart"
  ON staff_org_chart
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "allow_insert_staff_org_chart" ON staff_org_chart;
CREATE POLICY "allow_insert_staff_org_chart"
  ON staff_org_chart
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_staff_org_chart" ON staff_org_chart;
CREATE POLICY "allow_update_staff_org_chart"
  ON staff_org_chart
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_staff_org_chart" ON staff_org_chart;
CREATE POLICY "allow_delete_staff_org_chart"
  ON staff_org_chart
  FOR DELETE
  USING (true);

-- 6. Permissions
GRANT ALL ON staff_org_chart TO authenticated;
GRANT ALL ON staff_org_chart TO anon;
GRANT ALL ON staff_org_chart TO service_role;

-- 7. Add to Realtime publication if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE staff_org_chart;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
