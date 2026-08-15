-- Migration: Department Indent & Entitlement Setup (Distribution Module)
-- Description: Adds tables for department indent requests, request line items, and department item entitlements.

-- 1. Department Indent Entitlements Configuration
CREATE TABLE IF NOT EXISTS public.distribution_indent_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL,
  department_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('drug', 'non_drug')),
  item_id UUID NOT NULL,
  item_code TEXT,
  item_name TEXT NOT NULL,
  max_qty_per_request INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Department Indent Request Headers
CREATE TABLE IF NOT EXISTS public.distribution_indent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_number TEXT UNIQUE NOT NULL,
  hospital_id UUID NOT NULL,
  requesting_department_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  request_date TIMESTAMPTZ DEFAULT now(),
  required_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected','issued','completed','cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  issued_by UUID,
  issued_at TIMESTAMPTZ,
  received_by UUID,
  received_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Department Indent Request Items (Lines)
CREATE TABLE IF NOT EXISTS public.distribution_indent_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indent_request_id UUID NOT NULL REFERENCES public.distribution_indent_requests(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('drug', 'non_drug')),
  item_id UUID NOT NULL,
  item_code TEXT,
  item_name TEXT NOT NULL,
  unit TEXT DEFAULT 'UNIT',
  qty_requested INTEGER NOT NULL CHECK (qty_requested > 0),
  qty_approved INTEGER,
  qty_issued INTEGER DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_indent_requests_hosp_dept ON public.distribution_indent_requests (hospital_id, requesting_department_id);
CREATE INDEX IF NOT EXISTS idx_indent_requests_status ON public.distribution_indent_requests (status);
CREATE INDEX IF NOT EXISTS idx_indent_entitlements_hosp_dept ON public.distribution_indent_entitlements (hospital_id, department_id);

-- Enable RLS
ALTER TABLE public.distribution_indent_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_indent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_indent_request_items ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
CREATE POLICY "Allow all authenticated users full access to distribution_indent_entitlements" ON public.distribution_indent_entitlements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users full access to distribution_indent_requests" ON public.distribution_indent_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users full access to distribution_indent_request_items" ON public.distribution_indent_request_items FOR ALL USING (auth.role() = 'authenticated');
