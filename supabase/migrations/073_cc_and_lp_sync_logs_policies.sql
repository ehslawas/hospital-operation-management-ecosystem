-- Enable Row Level Security and add policies for cc_sync_logs and lp_sync_logs

ALTER TABLE IF EXISTS cc_sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on cc_sync_logs" ON cc_sync_logs;
CREATE POLICY "Allow all access on cc_sync_logs"
  ON cc_sync_logs FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE IF EXISTS lp_sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on lp_sync_logs" ON lp_sync_logs;
CREATE POLICY "Allow all access on lp_sync_logs"
  ON lp_sync_logs FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
