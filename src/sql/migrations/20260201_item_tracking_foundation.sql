-- Item Tracking Foundation Migration
-- Creates pharmacy_item_registry and pharmacy_item_movements

-- 1. Create pharmacy_item_registry table
CREATE TABLE IF NOT EXISTS public.pharmacy_item_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    qr_code TEXT UNIQUE NOT NULL,
    serial_number TEXT,
    item_id UUID NOT NULL, -- References drug_id or non_drug_id
    item_type TEXT NOT NULL CHECK (item_type IN ('drug', 'non_drug')),
    batch_id UUID REFERENCES public.pharmacy_stock_batches(id) ON DELETE SET NULL,
    current_location TEXT NOT NULL DEFAULT 'Main Store',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'issued', 'in_transit', 'consumed', 'expired', 'damaged', 'returned', 'transferred', 'decommissioned', 'stolen', 'disposed')),
    last_scanned_at TIMESTAMPTZ,
    last_scanned_by UUID CONSTRAINT pharmacy_item_registry_last_scanned_by_fkey REFERENCES public.users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create pharmacy_item_movements table
CREATE TABLE IF NOT EXISTS public.pharmacy_item_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    item_registry_id UUID NOT NULL REFERENCES public.pharmacy_item_registry(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('registered', 'received', 'issued', 'returned_from_dept', 'transferred', 'consumed', 'disposed', 'returned_to_supplier', 'status_change')),
    source_document_type TEXT,
    source_document_id UUID,
    source_document_number TEXT,
    from_location TEXT,
    to_location TEXT,
    performed_by UUID CONSTRAINT pharmacy_item_movements_performed_by_fkey REFERENCES public.users(id) ON DELETE SET NULL,
    performed_at TIMESTAMPTZ DEFAULT now(),
    scanned_at TIMESTAMPTZ,
    scan_method TEXT DEFAULT 'qr',
    previous_status TEXT,
    new_status TEXT,
    quantity INTEGER DEFAULT 1,
    remarks TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add Indexes
CREATE INDEX IF NOT EXISTS idx_item_registry_qr ON public.pharmacy_item_registry(qr_code);
CREATE INDEX IF NOT EXISTS idx_item_registry_hospital ON public.pharmacy_item_registry(hospital_id);
CREATE INDEX IF NOT EXISTS idx_item_registry_item ON public.pharmacy_item_registry(item_id);
CREATE INDEX IF NOT EXISTS idx_item_movements_registry ON public.pharmacy_item_movements(item_registry_id);
CREATE INDEX IF NOT EXISTS idx_item_movements_hospital ON public.pharmacy_item_movements(hospital_id);
CREATE INDEX IF NOT EXISTS idx_item_movements_performed_at ON public.pharmacy_item_movements(performed_at DESC);

-- 4. Enable RLS
ALTER TABLE public.pharmacy_item_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_item_movements ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS Policies
CREATE POLICY "Users can see items in their hospital"
    ON public.pharmacy_item_registry FOR SELECT
    USING (hospital_id IN (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage items in their hospital"
    ON public.pharmacy_item_registry FOR ALL
    USING (hospital_id IN (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can see movements in their hospital"
    ON public.pharmacy_item_movements FOR SELECT
    USING (hospital_id IN (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can record movements in their hospital"
    ON public.pharmacy_item_movements FOR INSERT
    WITH CHECK (hospital_id IN (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

-- 6. Functions for Reconciliation
DROP FUNCTION IF EXISTS public.reconcile_movements(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.reconcile_movements(
    p_hospital_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    res_registry_id UUID,
    res_qr_code TEXT,
    res_name TEXT,
    res_code TEXT,
    res_status TEXT,
    res_current_location TEXT,
    res_ledger_qty BIGINT,
    res_discrepancy BOOLEAN,
    res_last_scanned_at TIMESTAMPTZ,
    res_last_scanned_location TEXT,
    res_catalog_item_id UUID
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH scanned_items AS (
        SELECT 
            r.id,
            r.qr_code,
            r.item_id as catalog_id,
            r.status,
            r.current_location,
            r.last_scanned_at,
            r.hospital_id
        FROM public.pharmacy_item_registry r
        WHERE r.hospital_id = p_hospital_id
    ),
    ledger_summary AS (
        SELECT 
            item_id,
            SUM(quantity_on_hand)::BIGINT as ledger_qty
        FROM public.pharmacy_stock_batches
        WHERE hospital_id = p_hospital_id
        GROUP BY item_id
    )
    SELECT 
        si.id as res_registry_id,
        si.qr_code as res_qr_code,
        COALESCE(d.drug_name, nd.item_name, 'Unknown') as res_name,
        COALESCE(d.drug_code, nd.item_code, '-') as res_code,
        si.status as res_status,
        si.current_location as res_current_location,
        COALESCE(ls.ledger_qty, 0)::BIGINT as res_ledger_qty,
        (SELECT count(*) FROM scanned_items WHERE catalog_id = si.catalog_id)::BIGINT != COALESCE(ls.ledger_qty, 0)::BIGINT as res_discrepancy,
        si.last_scanned_at as res_last_scanned_at,
        si.current_location as res_last_scanned_location,
        si.catalog_id as res_catalog_item_id
    FROM scanned_items si
    LEFT JOIN ledger_summary ls ON si.catalog_id = ls.item_id
    LEFT JOIN public.drugs d ON si.catalog_id = d.id
    LEFT JOIN public.non_drugs nd ON si.catalog_id = nd.id;
END;
$$;
