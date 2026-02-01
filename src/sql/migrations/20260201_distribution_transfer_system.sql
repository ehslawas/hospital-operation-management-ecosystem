-- Migration: 20260201_distribution_transfer_system.sql
-- Description: Enhanced schema for Distribution Transfer System (Intrafacility & Interfacility)

-- 1. ENHANCE pharmacy_transfer_requests table
ALTER TABLE pharmacy_transfer_requests
ADD COLUMN IF NOT EXISTS flow_direction text CHECK (flow_direction IN ('request', 'issue', 'borrow', 'lend')) DEFAULT 'request',
ADD COLUMN IF NOT EXISTS from_facility_id uuid REFERENCES hospital_facilities(id),
ADD COLUMN IF NOT EXISTS to_facility_id uuid REFERENCES hospital_facilities(id),
ADD COLUMN IF NOT EXISTS issued_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS issued_at timestamptz,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_transfer_requests_flow_direction ON pharmacy_transfer_requests(flow_direction);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_from_facility ON pharmacy_transfer_requests(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_to_facility ON pharmacy_transfer_requests(to_facility_id);

-- 2. CREATE pharmacy_loan_records table (Interfacility Loan Ledger)
CREATE TABLE IF NOT EXISTS pharmacy_loan_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES hospitals(id),
    transfer_id uuid REFERENCES pharmacy_transfer_requests(id),
    loan_number text NOT NULL,
    loan_type text NOT NULL CHECK (loan_type IN ('borrowed', 'lent')),
    counterparty_facility_id uuid NOT NULL, -- Generic reference, could be hospital or clinic facility
    counterparty_name text, -- Denormalized name for easier display
    loan_date date NOT NULL,
    expected_return_date date,
    status text NOT NULL CHECK (status IN ('active', 'partial_return', 'fully_returned', 'written_off')),
    total_value numeric(10, 2) DEFAULT 0,
    notes text,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_records_hospital ON pharmacy_loan_records(hospital_id);
CREATE INDEX IF NOT EXISTS idx_loan_records_status ON pharmacy_loan_records(status);
CREATE INDEX IF NOT EXISTS idx_loan_records_type ON pharmacy_loan_records(loan_type);
CREATE INDEX IF NOT EXISTS idx_loan_records_counterparty ON pharmacy_loan_records(counterparty_facility_id);

-- Enable RLS for loan_records
ALTER TABLE pharmacy_loan_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loan records of their hospital" ON pharmacy_loan_records
    FOR SELECT USING (hospital_id = (select auth.user_hospital_id()));

CREATE POLICY "Users can insert loan records for their hospital" ON pharmacy_loan_records
    FOR INSERT WITH CHECK (hospital_id = (select auth.user_hospital_id()));

CREATE POLICY "Users can update loan records of their hospital" ON pharmacy_loan_records
    FOR UPDATE USING (hospital_id = (select auth.user_hospital_id()));

-- 3. CREATE pharmacy_loan_returns table (Return Tracking)
CREATE TABLE IF NOT EXISTS pharmacy_loan_returns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id uuid NOT NULL REFERENCES pharmacy_loan_records(id),
    return_number text NOT NULL,
    return_date date NOT NULL,
    received_by uuid REFERENCES auth.users(id),
    notes text,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_returns_loan_id ON pharmacy_loan_returns(loan_id);

-- Enable RLS for loan_returns
ALTER TABLE pharmacy_loan_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loan returns of their hospital" ON pharmacy_loan_returns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pharmacy_loan_records
            WHERE pharmacy_loan_records.id = pharmacy_loan_returns.loan_id
            AND pharmacy_loan_records.hospital_id = (select auth.user_hospital_id())
        )
    );

CREATE POLICY "Users can insert loan returns for their hospital" ON pharmacy_loan_returns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pharmacy_loan_records
            WHERE pharmacy_loan_records.id = pharmacy_loan_returns.loan_id
            AND pharmacy_loan_records.hospital_id = (select auth.user_hospital_id())
        )
    );

-- 4. CREATE pharmacy_loan_return_items table
CREATE TABLE IF NOT EXISTS pharmacy_loan_return_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id uuid NOT NULL REFERENCES pharmacy_loan_returns(id),
    loan_item_id uuid NOT NULL, -- References pharmacy_transfer_request_items(id) loosely or specific loan item table if we separated it
    quantity_returned integer NOT NULL,
    condition_notes text
);

CREATE INDEX IF NOT EXISTS idx_loan_return_items_return_id ON pharmacy_loan_return_items(return_id);

-- Enable RLS for loan_return_items
ALTER TABLE pharmacy_loan_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loan return items of their hospital" ON pharmacy_loan_return_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pharmacy_loan_returns
            JOIN pharmacy_loan_records ON pharmacy_loan_records.id = pharmacy_loan_returns.loan_id
            WHERE pharmacy_loan_returns.id = pharmacy_loan_return_items.return_id
            AND pharmacy_loan_records.hospital_id = (select auth.user_hospital_id())
        )
    );

CREATE POLICY "Users can insert loan return items for their hospital" ON pharmacy_loan_return_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pharmacy_loan_returns
            JOIN pharmacy_loan_records ON pharmacy_loan_records.id = pharmacy_loan_returns.loan_id
            WHERE pharmacy_loan_returns.id = pharmacy_loan_return_items.return_id
            AND pharmacy_loan_records.hospital_id = (select auth.user_hospital_id())
        )
    );

-- 5. Helper function for loan number generation
CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix text;
    year text;
    seq text;
BEGIN
    year := to_char(NEW.created_at, 'YYYY');
    
    IF NEW.loan_type = 'borrowed' THEN
        prefix := 'LB'; -- Loan Borrowed
    ELSE
        prefix := 'LL'; -- Loan Lent
    END IF;
    
    -- Get next sequence number (simulated basic sequence)
    -- In production, might use a sequence generator
    seq := lpad(cast(floor(random() * 10000) as text), 4, '0');
    
    NEW.loan_number := prefix || '-' || year || '-' || seq;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_loan_number
BEFORE INSERT ON pharmacy_loan_records
FOR EACH ROW
WHEN (NEW.loan_number IS NULL)
EXECUTE FUNCTION generate_loan_number();
