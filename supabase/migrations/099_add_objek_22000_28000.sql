-- Add new Objek and Kategori codes for Program 020200

-- 1. Insert New Objeks for 020200
INSERT INTO admin_warrant_objeks (program_code, objek_code, objek_name, description) VALUES
    ('020200', '22000', 'Pengangkutan', 'Transportation expenses'),
    ('020200', '28000', 'Penyelenggaraan', 'Maintenance expenses')
ON CONFLICT (program_code, objek_code) DO NOTHING;

-- 2. Insert Kategori 22000 (Pengangkutan Barang) under Objek 22000
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code)
VALUES ('020200', '22000', '22000', 'Pengangkutan Barang', false, NULL)
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- 3. Insert Kategori 28000 (Penyelenggaraan) under Objek 28000
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code)
VALUES ('020200', '28000', '28000', 'Penyelenggaraan', false, NULL)
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;
