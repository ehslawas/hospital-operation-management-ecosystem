-- 02_repair_therapeutic_classes.sql
-- This script ensures the therapeutic_class_id column exists and re-runs the data population.
-- It handles cases where the column was missing or the data update failed.

DO $$
BEGIN
    -- 1. Ensure the column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'drugs'
        AND column_name = 'therapeutic_class_id'
    ) THEN
        ALTER TABLE public.drugs
        ADD COLUMN therapeutic_class_id UUID REFERENCES public.drug_categories(id);
        
        RAISE NOTICE 'Added therapeutic_class_id column to drugs table';
    ELSE
        RAISE NOTICE 'therapeutic_class_id column already exists';
    END IF;

    -- 2. Ensure categories exist (in case they were missed)
    -- We assume standard categories are already seeded, but we'll retry inserts safely.
    -- (This part repeats the seed logic just in case)
END $$;

-- 2. Insert Standard Therapeutic Categories (Global)
-- Using ON CONFLICT to avoid duplicates
INSERT INTO public.drug_categories (hospital_id, category_code, category_name, description, updated_at)
VALUES 
    (NULL, 'ANTIHYPERTENSIVE', 'Anti-hypertensive', 'Medications for high blood pressure', NOW()),
    (NULL, 'ANTIBIOTIC', 'Antibiotic', 'Antibacterial medications', NOW()),
    (NULL, 'ART', 'Anti-Retroviral Therapy', 'HIV/AIDS medications', NOW()),
    (NULL, 'ANTIDIABETIC', 'Anti-diabetic', 'Diabetes medications', NOW()),
    (NULL, 'ANALGESIC', 'Analgesic/Antipyretic', 'Pain relief and fever medications', NOW()),
    (NULL, 'RESPIRATORY', 'Respiratory', 'Asthma and respiratory medications', NOW()),
    (NULL, 'CARDIOVASCULAR', 'Cardiovascular', 'Heart conditions excluding hypertension', NOW()),
    (NULL, 'GASTROINTESTINAL', 'Gastrointestinal', 'Stomach and digestive medications', NOW()),
    (NULL, 'CNS', 'Central Nervous System', 'Neurological and psychiatric medications', NOW()),
    (NULL, 'DERMATOLOGICAL', 'Dermatological', 'Skin medications', NOW()),
    (NULL, 'VITAMIN', 'Vitamin/Supplement', 'Nutritional supplements', NOW()),
    (NULL, 'VACCINE', 'Vaccine', 'Immunizations', NOW()),
    (NULL, 'ANESTHETIC', 'Anesthetic', 'Anesthesia medications', NOW()),
    (NULL, 'ONCOLOGY', 'Oncology', 'Cancer medications', NOW())
ON CONFLICT (hospital_id, category_code) 
WHERE hospital_id IS NULL
DO NOTHING;

-- 3. Re-run the Automatic Mapping
-- This will populate the therapeutic_class_id column for matching drugs.

DO $$
BEGIN

-- ANTIBIOTICS
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'ANTIBIOTIC' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Amoxicillin%' OR
    drug_name ILIKE '%Ampicilin%' OR
    drug_name ILIKE '%Ampicillin%' OR
    drug_name ILIKE '%Cef%' OR
    drug_name ILIKE '%Meropenem%' OR
    drug_name ILIKE '%Azithromycin%' OR
    drug_name ILIKE '%Erythromycin%' OR
    drug_name ILIKE '%Ciprofloxacin%' OR
    drug_name ILIKE '%Doxycycline%' OR
    drug_name ILIKE '%Metronidazole%' OR
    drug_name ILIKE '%Gentamicin%' OR
    drug_name ILIKE '%Cloxacillin%' OR
    drug_name ILIKE '%Penicillin%' OR
    drug_name ILIKE '%Sulbactam%' OR
    drug_name ILIKE '%Rifampicin%' OR -- Added from user screenshot (J04AM...)
    drug_name ILIKE '%Isoniazid%' -- Added from user screenshot
);

-- ANTI-HYPERTENSIVE
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'ANTIHYPERTENSIVE' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Amlodipine%' OR
    drug_name ILIKE '%Losartan%' OR
    drug_name ILIKE '%Perindopril%' OR
    drug_name ILIKE '%Enalapril%' OR
    drug_name ILIKE '%Atenolol%' OR
    drug_name ILIKE '%Bisoprolol%' OR
    drug_name ILIKE '%Metoprolol%' OR
    drug_name ILIKE '%Nifedipine%' OR
    drug_name ILIKE '%Valsartan%' OR
    drug_name ILIKE '%Telmisartan%' OR
    drug_name ILIKE '%Prazosin%' OR
    drug_name ILIKE '%Labetalol%'
);

-- ANTI-RETROVIRAL THERAPY (ART)
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'ART' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Abacavir%' OR
    drug_name ILIKE '%Lamivudine%' OR
    drug_name ILIKE '%Tenofovir%' OR
    drug_name ILIKE '%Efavirenz%' OR
    drug_name ILIKE '%Zidovudine%' OR
    drug_name ILIKE '%Lopinavir%' OR
    drug_name ILIKE '%Ritonavir%' OR
    drug_name ILIKE '%Nevirapine%' OR
    drug_name ILIKE '%Dolutegravir%'
);

-- ANTIDIABETIC
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'ANTIDIABETIC' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Metformin%' OR
    drug_name ILIKE '%Gliclazide%' OR
    drug_name ILIKE '%Insulin%' OR
    drug_name ILIKE '%Glibenclamide%' OR
    drug_name ILIKE '%Dapagliflozin%' OR
    drug_name ILIKE '%Empagliflozin%' OR
    drug_name ILIKE '%Sitagliptin%'
);

-- ANALGESIC / ANTIPYRETIC
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'ANALGESIC' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Paracetamol%' OR
    drug_name ILIKE '%Ibuprofen%' OR
    drug_name ILIKE '%Diclofenac%' OR
    drug_name ILIKE '%Tramadol%' OR
    drug_name ILIKE '%Morphine%' OR
    drug_name ILIKE '%Fentanyl%' OR
    drug_name ILIKE '%Aspirin%' OR
    drug_name ILIKE '%Ketoprofen%' OR
    drug_name ILIKE '%Celecoxib%' OR
    drug_name ILIKE '%Mefenamic%' OR
    drug_name ILIKE '%ACETYLSALICYLIC%' -- Matches Aspirin chemical name
);

-- RESPIRATORY
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'RESPIRATORY' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Salbutamol%' OR
    drug_name ILIKE '%Budesonide%' OR
    drug_name ILIKE '%Ipratropium%' OR
    drug_name ILIKE '%Fluticasone%' OR
    drug_name ILIKE '%Beclomethasone%' OR
    drug_name ILIKE '%Montelukast%' OR
    drug_name ILIKE '%Theophylline%' OR
    drug_name ILIKE '%Acetylcysteine%' -- Mucolytic
);

-- CARDIOVASCULAR
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'CARDIOVASCULAR' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Simvastatin%' OR
    drug_name ILIKE '%Atorvastatin%' OR
    drug_name ILIKE '%Rosuvastatin%' OR
    drug_name ILIKE '%Digoxin%' OR
    drug_name ILIKE '%Isosorbide%' OR
    drug_name ILIKE '%Glyceryl Trinitrate%' OR
    drug_name ILIKE '%Warfarin%' OR
    drug_name ILIKE '%Clopidogrel%' OR
    drug_name ILIKE '%Heparin%'
);

-- GASTROINTESTINAL
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'GASTROINTESTINAL' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Omeprazole%' OR
    drug_name ILIKE '%Pantoprazole%' OR
    drug_name ILIKE '%Ranitidine%' OR
    drug_name ILIKE '%Metoclopramide%' OR
    drug_name ILIKE '%Domperidone%' OR
    drug_name ILIKE '%Lactulose%' OR
    drug_name ILIKE '%Bisacodyl%' OR
    drug_name ILIKE '%Hyoscine%'
);

-- CNS
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'CNS' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Diazepam%' OR
    drug_name ILIKE '%Lorazepam%' OR
    drug_name ILIKE '%Midazolam%' OR
    drug_name ILIKE '%Phenytoin%' OR
    drug_name ILIKE '%Valproate%' OR
    drug_name ILIKE '%Carbamazepine%' OR
    drug_name ILIKE '%Amitriptyline%' OR
    drug_name ILIKE '%Fluoxetine%' OR
    drug_name ILIKE '%Sertraline%' OR
    drug_name ILIKE '%Haloperidol%' OR
    drug_name ILIKE '%Risperidone%' OR
    drug_name ILIKE '%Olanzapine%' OR
    drug_name ILIKE '%Acetazolamide%' -- CNS/Diuretic
);

-- VITAMIN
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'VITAMIN' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Vitamin%' OR
    drug_name ILIKE '%Calcium%' OR
    drug_name ILIKE '%Ferrous%' OR
    drug_name ILIKE '%Folic Acid%' OR
    drug_name ILIKE '%Multivitamin%' OR
    drug_name ILIKE '%Thiamine%' OR
    drug_name ILIKE '%Ascorbic%' OR
    drug_name ILIKE '%Potassium Chloride%'
);

-- DERMATOLOGICAL
UPDATE public.drugs
SET therapeutic_class_id = (
    SELECT id FROM public.drug_categories 
    WHERE category_code = 'DERMATOLOGICAL' 
    AND (hospital_id = public.drugs.hospital_id OR hospital_id IS NULL)
    ORDER BY hospital_id DESC NULLS LAST 
    LIMIT 1
)
WHERE therapeutic_class_id IS NULL 
AND (
    drug_name ILIKE '%Cream%' OR
    drug_name ILIKE '%Ointment%' OR
    drug_name ILIKE '%Lotion%' OR
    drug_name ILIKE '%Gel%' OR
    drug_name ILIKE '%Betamethasone%' OR
    drug_name ILIKE '%Hydrocortisone%' OR
    drug_name ILIKE '%Calamine%' OR
    drug_name ILIKE '%Acetic Acid%' -- often used topically or for ear drops, could be dermatological or other.
);


END $$;
