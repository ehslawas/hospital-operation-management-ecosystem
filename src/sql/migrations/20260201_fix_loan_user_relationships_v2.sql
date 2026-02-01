-- Migration: fix_loan_user_relationships_v2
-- Redirect foreign keys from auth.users to public.users to allow PostgREST joins

-- Fix pharmacy_loan_records (created_by)
ALTER TABLE pharmacy_loan_records
DROP CONSTRAINT IF EXISTS pharmacy_loan_records_created_by_fkey;

ALTER TABLE pharmacy_loan_records
ADD CONSTRAINT pharmacy_loan_records_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Fix pharmacy_loan_returns (created_by)
ALTER TABLE pharmacy_loan_returns
DROP CONSTRAINT IF EXISTS pharmacy_loan_returns_created_by_fkey;

ALTER TABLE pharmacy_loan_returns
ADD CONSTRAINT pharmacy_loan_returns_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Fix pharmacy_transfer_requests (consistent mapping)
ALTER TABLE pharmacy_transfer_requests
DROP CONSTRAINT IF EXISTS pharmacy_transfer_requests_requested_by_fkey;

ALTER TABLE pharmacy_transfer_requests
ADD CONSTRAINT pharmacy_transfer_requests_requested_by_fkey 
FOREIGN KEY (requested_by) REFERENCES public.users(id);

ALTER TABLE pharmacy_transfer_requests
DROP CONSTRAINT IF EXISTS pharmacy_transfer_requests_approved_by_fkey;

ALTER TABLE pharmacy_transfer_requests
ADD CONSTRAINT pharmacy_transfer_requests_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.users(id);

-- Note: received_by exists in transfer_requests but not in loan_returns in the current DB state
ALTER TABLE pharmacy_transfer_requests
DROP CONSTRAINT IF EXISTS pharmacy_transfer_requests_received_by_fkey;

ALTER TABLE pharmacy_transfer_requests
ADD CONSTRAINT pharmacy_transfer_requests_received_by_fkey 
FOREIGN KEY (received_by) REFERENCES public.users(id);
