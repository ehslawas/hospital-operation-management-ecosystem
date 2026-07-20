-- Migration: 046_hospital_wide_budget_forecasting.sql
-- Create table for storing hospital budget forecast justifications and simulated revisions

CREATE TABLE IF NOT EXISTS hospital_forecast_justifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  proposed_topup DECIMAL(15,2) DEFAULT 0.00,
  justification_text TEXT,
  priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hospital_forecast_justifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read for authenticated users" 
  ON hospital_forecast_justifications FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow insert/update for authenticated users" 
  ON hospital_forecast_justifications FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Unique index to prevent duplicate entries for the same category in a given year
CREATE UNIQUE INDEX IF NOT EXISTS idx_forecast_justifications_year_category 
  ON hospital_forecast_justifications (hospital_id, fiscal_year, category_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_hospital_forecast_justifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_hospital_forecast_justifications_updated_at
  BEFORE UPDATE ON hospital_forecast_justifications
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_forecast_justifications_updated_at();
