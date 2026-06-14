-- Migration 112: Refine Temperature System
-- 1. Create Locations Table
CREATE TABLE IF NOT EXISTS public.pharmacy_temperature_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'freezer', 'chiller', 'room', 'refrigerator'
    min_limit DECIMAL(5,2) NOT NULL,
    max_limit DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pharmacy_temperature_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view locations for their hospital" ON public.pharmacy_temperature_locations
    FOR SELECT USING (hospital_id = (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage locations for their hospital" ON public.pharmacy_temperature_locations
    FOR ALL USING (hospital_id = (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

-- 2. Update Readings Table
-- Rename existing limits for clarity
ALTER TABLE public.pharmacy_temperature_readings RENAME COLUMN min_temp TO min_limit;
ALTER TABLE public.pharmacy_temperature_readings RENAME COLUMN max_temp TO max_limit;

-- Add actual reading columns (Min/Max memory)
ALTER TABLE public.pharmacy_temperature_readings ADD COLUMN min_reading DECIMAL(5,2);
ALTER TABLE public.pharmacy_temperature_readings ADD COLUMN max_reading DECIMAL(5,2);

-- Update Compliance Logic (Drop and Recreate)
ALTER TABLE public.pharmacy_temperature_readings DROP COLUMN is_compliant;

ALTER TABLE public.pharmacy_temperature_readings 
ADD COLUMN is_compliant BOOLEAN GENERATED ALWAYS AS (
    current_temp >= min_limit AND current_temp <= max_limit
    AND (min_reading IS NULL OR min_reading >= min_limit)
    AND (max_reading IS NULL OR max_reading <= max_limit)
) STORED;

-- 3. Seed some default locations for existing hospitals (Optional, but helpful)
-- (We'll skip complex seeding for now, User can add)
