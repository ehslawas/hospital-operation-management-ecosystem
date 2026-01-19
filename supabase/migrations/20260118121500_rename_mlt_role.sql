-- Migration: Rename "Medical Lab Technician" to "Medical Laboratory Technologist"
-- Description: Updates the role name for medical_lab_technician.

DO $$
BEGIN
    UPDATE public.roles
    SET role_name = 'Medical Laboratory Technologist'
    WHERE role_code = 'medical_lab_technician';

    RAISE NOTICE 'Renamed Medical Lab Technician to Medical Laboratory Technologist';
END $$;
