-- =====================================================
-- Migration 068: Create store_locations table
-- Description: Enables storekeepers to manage physical store locations (Store -> Cabinet/Rack -> Level/Shelf)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_locations (
    id VARCHAR(100) PRIMARY KEY,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    store_name VARCHAR(150) NOT NULL,
    cabinet_rack VARCHAR(150) NOT NULL,
    shelf_level VARCHAR(150) NOT NULL,
    location_code VARCHAR(100) NOT NULL,
    location_type VARCHAR(50) NOT NULL DEFAULT 'both', -- 'drug', 'non_drug', 'both'
    storage_condition VARCHAR(50) NOT NULL DEFAULT 'ambient', -- 'ambient', 'cold_2_8c', 'controlled', 'frozen'
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_store_location_code_per_hospital UNIQUE (hospital_id, location_code)
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_store_locations_hospital ON public.store_locations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_store_locations_type ON public.store_locations(location_type);

-- RLS Enablement
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access for store_locations"
    ON public.store_locations FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated insert for store_locations"
    ON public.store_locations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated update for store_locations"
    ON public.store_locations FOR UPDATE
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated delete for store_locations"
    ON public.store_locations FOR DELETE
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

