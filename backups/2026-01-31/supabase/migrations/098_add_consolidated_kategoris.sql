-- Add consolidated Kategori codes to support the simplified UI

-- 1. Program 020200 (Pengurusan Hospital), Objek 27000 (Bekalan)
-- Consolidates 27100, 27200, 27300, 27600, 27700 into '27000'
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code)
VALUES ('020200', '27000', '27000', 'Bekalan dan Bahan-bahan Lain', false, NULL)
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- 2. Program 022300 (Dietetik Dan Sajian), Objek 25000 (Bahan Makanan)
-- Consolidates 25100-25600 into '25000'
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code)
VALUES ('022300', '25000', '25000', 'Bahan Makanan dan Minuman', false, NULL)
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- 3. Program 022300 (Dietetik Dan Sajian), Objek 27000 (Bekalan)
-- Consolidates 27100-27700 into '27000'
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code)
VALUES ('022300', '27000', '27000', 'Bekalan dan Bahan-bahan Lain', false, NULL)
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;
