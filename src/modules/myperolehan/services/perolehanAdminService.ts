// src/modules/myperolehan/services/perolehanAdminService.ts
// Robust Service Layer for Hospital Admin Procurement & Budget Monitoring with Master Seed Parity

import { supabase } from '@/services/supabase'
import type {
  AdminProgram,
  AdminObjek,
  AdminKategori,
  AdminWarrant,
  AdminPembangunan,
  AdminSupplier,
  AdminPerihalItem,
  AdminPurchaseOrder,
  AdminPurchaseOrderItem,
  AdminLPO,
  AdminReceivingRecord,
  AdminReceivingItem,
  AdminPayment,
  BudgetHierarchySummary,
  OverallPerolehanKPIs,
  POStatus
} from '@/shared/types/myperolehan'

export const DEFAULT_HOSPITAL_ID = '85bb6adc-b868-428b-83f4-e5af2f5cf904' // Hospital Lawas Master ID

// -----------------------------------------------------------------------------
// DEFAULT MASTER SEED DATA (Parity Fallbacks)
// -----------------------------------------------------------------------------

export const DEFAULT_ADMIN_PROGRAMS: AdminProgram[] = [
  {
    id: '986e6b71-7a24-4e8a-985d-5e80382c6e49',
    hospital_id: DEFAULT_HOSPITAL_ID,
    code: '020200',
    label: 'Pengurusan Hospital',
    description: 'Hospital Management operational expenses',
    budget_type: 'warrant',
    is_active: true
  },
  {
    id: '9f5961b6-b7c8-4ff7-a127-defde3c6d186',
    hospital_id: DEFAULT_HOSPITAL_ID,
    code: '022300',
    label: 'Dietetik Dan Sajian',
    description: 'Dietetics and Food Service expenses',
    budget_type: 'warrant',
    is_active: true
  },
  {
    id: '998cd36f-ec9e-4a0e-b4d5-137a70bf682d',
    hospital_id: DEFAULT_HOSPITAL_ID,
    code: 'P42',
    label: 'Pembangunan',
    description: 'Development Program & Equipment Leasing',
    budget_type: 'pembangunan',
    is_active: true
  }
]

export const DEFAULT_ADMIN_OBJEKS: AdminObjek[] = [
  {
    id: '107d44b9-ea5b-47a6-bc16-7eedfc6751e1',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '986e6b71-7a24-4e8a-985d-5e80382c6e49',
    code: '22000',
    label: 'Pengangkutan',
    description: 'Transportation expenses',
    is_active: true
  },
  {
    id: 'ed0e2c7e-aefa-4d22-b606-d91d8c7cdb80',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '986e6b71-7a24-4e8a-985d-5e80382c6e49',
    code: '24000',
    label: 'Sewaan',
    description: 'Rental expenses',
    is_active: true
  },
  {
    id: 'b95f1b5a-4fc6-4860-aa70-620c30ba4f22',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '986e6b71-7a24-4e8a-985d-5e80382c6e49',
    code: '27000',
    label: 'Bekalan dan Bahan Lain',
    description: 'Supplies and other materials',
    is_active: true
  },
  {
    id: '07eb6681-a257-4fce-b662-e6b585f0255b',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '986e6b71-7a24-4e8a-985d-5e80382c6e49',
    code: '28000',
    label: 'Penyelenggaraan',
    description: 'Maintenance expenses',
    is_active: true
  },
  {
    id: 'c00c105f-f0ff-408a-a438-25b8e73425b2',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '986e6b71-7a24-4e8a-985d-5e80382c6e49',
    code: '29000',
    label: 'Perkhidmatan Iktisas Yang Lain',
    description: 'Other professional services',
    is_active: true
  },
  // 022300 Objek
  {
    id: '3e96b593-a78a-408b-98ed-e51c269c6d1f',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '9f5961b6-b7c8-4ff7-a127-defde3c6d186',
    code: '25000',
    label: 'Bahan Makanan dan Minuman',
    description: 'Food and beverage supplies',
    is_active: true
  },
  {
    id: 'cc6796b3-4aff-470d-a886-7723eac04b9c',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '9f5961b6-b7c8-4ff7-a127-defde3c6d186',
    code: '27000',
    label: 'Bekalan dan Bahan Lain',
    description: 'Supplies and other materials',
    is_active: true
  },
  {
    id: 'a6f0352a-2933-418a-b31e-d1b19fb5ef19',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '9f5961b6-b7c8-4ff7-a127-defde3c6d186',
    code: '29000',
    label: 'Perkhidmatan',
    description: 'Dietetic Services & Outsource Food',
    is_active: true
  },
  // P42 Objek
  {
    id: 'ea83208b-a302-46a4-9d43-33b4d3847944',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '998cd36f-ec9e-4a0e-b4d5-137a70bf682d',
    code: '01100 117 4002',
    label: 'Sewaan Peralatan Perubatan (Leasing 3.0)',
    description: 'Medical Equipment Rental',
    is_active: true
  },
  {
    id: 'd85090ff-e850-430f-b5cc-271fb465a46d',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '998cd36f-ec9e-4a0e-b4d5-137a70bf682d',
    code: '01200 117 1002',
    label: 'Perkhidmatan Sokongan Hospital (PSH)',
    description: 'Hospital Support Services Concession',
    is_active: true
  },
  {
    id: 'b2aa9912-fdcb-4c1e-b1ca-cc3cf1087982',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_id: '998cd36f-ec9e-4a0e-b4d5-137a70bf682d',
    code: '00105 106 1105',
    label: 'Latihan Dalam Perkhidmatan (LDP)',
    description: 'Latihan Dalam Perkhidmatan',
    is_active: true
  }
]

export const DEFAULT_ADMIN_KATEGORIS: AdminKategori[] = [
  {
    id: '4206a7fa-2039-4eda-8a4d-b0980c79c45f',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: '107d44b9-ea5b-47a6-bc16-7eedfc6751e1',
    code: '22000',
    label: 'Pengangkutan Barang',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: '8b579430-dd8a-4dd1-8263-94bd81541250',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'ed0e2c7e-aefa-4d22-b606-d91d8c7cdb80',
    code: '24699',
    label: 'Sewaan Mesin Penyalin',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: 'c8c7418e-71ce-4ecc-b24f-ca1d7f128598',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'ed0e2c7e-aefa-4d22-b606-d91d8c7cdb80',
    code: '24999',
    label: 'Sewaan Gas Perubatan (Linde)',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: '20b3533f-f203-4703-8369-a9debf784598',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'ed0e2c7e-aefa-4d22-b606-d91d8c7cdb80',
    code: '24202',
    label: 'Sewaan Bangunan Pejabat',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: 'cb6cef38-c184-4083-9bfa-a93d6124d24f',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'b95f1b5a-4fc6-4860-aa70-620c30ba4f22',
    code: '27000',
    label: 'Bekalan dan Bahan-bahan Lain',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: 'd2143517-213f-4c03-82b4-1bf6b6aad59c',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: '07eb6681-a257-4fce-b662-e6b585f0255b',
    code: '28000',
    label: 'Penyelenggaraan & Pembaikan',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: '18973697-4239-4099-a849-2abff67af451',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'c00c105f-f0ff-408a-a438-25b8e73425b2',
    code: '29201',
    label: 'Perkhidmatan Percetakan',
    is_shared_budget: true,
    budget_group_code: 'percetakan_020200_29000',
    is_active: true
  },
  {
    id: '15cd5b1c-3965-4b2b-9540-74b2dcc0f229',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'c00c105f-f0ff-408a-a438-25b8e73425b2',
    code: '29126',
    label: 'Perkhidmatan Persediaan Makanan',
    is_shared_budget: true,
    budget_group_code: 'makanan_020200_29000',
    is_active: true
  },
  {
    id: '4a10d69c-3cce-44c1-846c-0084446f8225',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'c00c105f-f0ff-408a-a438-25b8e73425b2',
    code: '29122',
    label: 'Perkhidmatan Kawalan Keselamatan',
    is_shared_budget: false,
    is_active: true
  },
  // 022300 Kategori
  {
    id: '7d2d3be1-9690-4f45-a789-1169374db367',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: '3e96b593-a78a-408b-98ed-e51c269c6d1f',
    code: '25000',
    label: 'Bahan Makanan dan Minuman Mentah',
    is_shared_budget: true,
    budget_group_code: 'makanan_022300_25000',
    is_active: true
  },
  {
    id: '0ad28d4f-7719-4982-ad25-f630c5239912',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'cc6796b3-4aff-470d-a886-7723eac04b9c',
    code: '27000',
    label: 'Bekalan dan Bahan Dietetik',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: '4c3e9dc8-1d2d-4401-97f2-15286a7f45bd',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'a6f0352a-2933-418a-b31e-d1b19fb5ef19',
    code: '29126',
    label: 'Perkhidmatan Persediaan Makanan (Outsource)',
    is_shared_budget: false,
    is_active: true
  },
  // P42 Kategori
  {
    id: '85d2ff2c-f94e-4db9-b45d-082df9f58ad6',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'ea83208b-a302-46a4-9d43-33b4d3847944',
    code: '24000-GA',
    label: 'GA Machine With Patient Monitor',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: 'e17919fd-ae04-4b8e-a132-50777e5c6f80',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'ea83208b-a302-46a4-9d43-33b4d3847944',
    code: '24000-US',
    label: 'Ultrasound Medium End Radio',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: '5300cd99-0236-4e75-adb7-c8d27b43c7c5',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'ea83208b-a302-46a4-9d43-33b4d3847944',
    code: '24000-HD',
    label: 'Mesin Haemodialisis',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: '42b13d67-0268-4f6c-a469-735be3a4b445',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'd85090ff-e850-430f-b5cc-271fb465a46d',
    code: '28000,29000',
    label: 'Penyelenggaraan & Sokongan Perkhidmatan Hospital (PSH)',
    is_shared_budget: false,
    is_active: true
  },
  {
    id: '4ad83362-6f4b-4a2f-8edc-21df6c6d82bb',
    hospital_id: DEFAULT_HOSPITAL_ID,
    objek_id: 'b2aa9912-fdcb-4c1e-b1ca-cc3cf1087982',
    code: '29000',
    label: 'Latihan Dalam Perkhidmatan (LDP)',
    is_shared_budget: false,
    is_active: true
  }
]

export const DEFAULT_ADMIN_WARRANTS: AdminWarrant[] = [
  {
    id: 'd7a231e1-47f8-48e8-939c-41a74774e383',
    hospital_id: DEFAULT_HOSPITAL_ID,
    warrant_date: '2026-01-01',
    document_no: 'WA/2026/FNB/001',
    vote_code: '25000',
    vote_activity: '022300',
    category: '25000',
    amount: 500000.0,
    description: 'Bahan Makanan dan Minuman 2026',
    program_code: '022300',
    objek_code: '25000',
    kategori_code: '25000',
    fiscal_year: 2026,
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf'
  },
  {
    id: '436e0956-e83c-4c73-9faf-cffc85fcce28',
    hospital_id: DEFAULT_HOSPITAL_ID,
    warrant_date: '2026-01-01',
    document_no: 'WA/2026/DSP/001',
    vote_code: '27000',
    vote_activity: '022300',
    category: '27000',
    amount: 45000.0,
    description: 'Bekalan dan Bahan Dietetik 2026',
    program_code: '022300',
    objek_code: '27000',
    kategori_code: '27000',
    fiscal_year: 2026,
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf'
  },
  {
    id: 'fd80eb3f-c376-42fd-8965-2c991d0a5c4f',
    hospital_id: DEFAULT_HOSPITAL_ID,
    warrant_date: '2026-01-01',
    document_no: 'WA/2026/OUT/001',
    vote_code: '29000',
    vote_activity: '022300',
    category: '29126',
    amount: 180000.0,
    description: 'Perkhidmatan Persediaan Makanan (Outsource) 2026',
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    fiscal_year: 2026,
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf'
  },
  // 020200 Warrants Inflow
  {
    id: 'e1234567-47f8-48e8-939c-41a74774e384',
    hospital_id: DEFAULT_HOSPITAL_ID,
    warrant_date: '2026-01-01',
    document_no: 'WA/2026/ADM/001',
    vote_code: '24000',
    vote_activity: '020200',
    category: '24699',
    amount: 150000.0,
    description: 'Waran Perkhidmatan Sewaan Mesin & Bangunan 2026',
    program_code: '020200',
    objek_code: '24000',
    kategori_code: '24699',
    fiscal_year: 2026,
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf'
  },
  {
    id: 'e1234567-47f8-48e8-939c-41a74774e385',
    hospital_id: DEFAULT_HOSPITAL_ID,
    warrant_date: '2026-01-01',
    document_no: 'WA/2026/ADM/002',
    vote_code: '28000',
    vote_activity: '020200',
    category: '28000',
    amount: 180000.0,
    description: 'Waran Penyelenggaraan Hospital 2026',
    program_code: '020200',
    objek_code: '28000',
    kategori_code: '28000',
    fiscal_year: 2026,
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf'
  },
  {
    id: 'e1234567-47f8-48e8-939c-41a74774e386',
    hospital_id: DEFAULT_HOSPITAL_ID,
    warrant_date: '2026-01-01',
    document_no: 'WA/2026/ADM/003',
    vote_code: '29000',
    vote_activity: '020200',
    category: '29122',
    amount: 220000.0,
    description: 'Waran Kawalan Keselamatan & Percetakan 2026',
    program_code: '020200',
    objek_code: '29000',
    kategori_code: '29122',
    fiscal_year: 2026,
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf'
  }
]

export const DEFAULT_ADMIN_PEMBANGUNAN: AdminPembangunan[] = [
  {
    id: '614f2170-5be9-4d95-8840-ee622c73070a',
    hospital_id: DEFAULT_HOSPITAL_ID,
    document_no: '91000762',
    pembangunan_date: '2026-01-30',
    fiscal_year: 2026,
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000,29000',
    amount: 103380.0,
    description: 'Perkhidmatan Sewaan Peralatan Perubatan (Leasing 3.0) Tahun 2026',
    created_by: '21fbce58-1b02-4b8b-9147-1d063546b45b'
  },
  {
    id: 'e085a2b7-32a2-4a92-9f12-7c36c47ff8a7',
    hospital_id: DEFAULT_HOSPITAL_ID,
    document_no: '91000913',
    pembangunan_date: '2026-01-21',
    fiscal_year: 2026,
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000,29000',
    amount: 3121000.0,
    description: 'Waran Peruntukan Konsesi Perkhidmatan Sokongan Hospital bg Bulan Januari hingga Ogos Tahun 2026',
    created_by: '21fbce58-1b02-4b8b-9147-1d063546b45b'
  },
  {
    id: '6a6888e0-4bfc-4cf8-9d7c-5ea84d491fa0',
    hospital_id: DEFAULT_HOSPITAL_ID,
    document_no: '91000762',
    pembangunan_date: '2026-01-14',
    fiscal_year: 2026,
    program_code: 'P42',
    objek_code: '01100 117 4002',
    kategori_code: '24000-GA',
    amount: 48276.0,
    description: 'Waran Agihan P42 BP01100 bagi Bayaran Perkhidmatan Sewaan Peralatan Perubatan (Leasing 3.0) Tahun 2026',
    created_by: '21fbce58-1b02-4b8b-9147-1d063546b45b'
  },
  {
    id: '439ee535-afe7-4702-9d09-62862890cdc0',
    hospital_id: DEFAULT_HOSPITAL_ID,
    document_no: '91000913',
    pembangunan_date: '2026-02-06',
    fiscal_year: 2026,
    program_code: 'P42',
    objek_code: '01100 117 4002',
    kategori_code: '24000-US',
    amount: 123456.0,
    description: 'Waran Agihan P42 Ultrasound Medium End Radio Tahun 2026',
    created_by: 'aeb9f13d-a2fa-4713-92fc-9701664813cf'
  },
  {
    id: 'd829d012-672f-4606-9fb4-a931a6731fef',
    hospital_id: DEFAULT_HOSPITAL_ID,
    document_no: '91000762',
    pembangunan_date: '2026-02-06',
    fiscal_year: 2026,
    program_code: 'P42',
    objek_code: '01100 117 4002',
    kategori_code: '24000-US',
    amount: 12345.0,
    description: 'Waran Agihan P42 Penyelenggaraan Ultrasound',
    created_by: 'aeb9f13d-a2fa-4713-92fc-9701664813cf'
  },
  {
    id: '9dd22d56-8eb7-4908-b049-866c784db68e',
    hospital_id: DEFAULT_HOSPITAL_ID,
    document_no: '91000913',
    pembangunan_date: '2026-02-06',
    fiscal_year: 2026,
    program_code: 'P42',
    objek_code: '00105 106 1105',
    kategori_code: '29000',
    amount: 1234.0,
    description: 'Peruntukan Latihan Dalam Perkhidmatan Hospital 2026',
    created_by: 'aeb9f13d-a2fa-4713-92fc-9701664813cf'
  }
]

export const DEFAULT_ADMIN_SUPPLIERS: AdminSupplier[] = [
  {
    id: 'sup-1',
    hospital_id: DEFAULT_HOSPITAL_ID,
    supplier_code: 'SUP-001',
    company_name: 'Edgenta Mediserve Sdn Bhd',
    address: 'Level 16, Menara UEM, Tower 1, Avenue 7, Bangsar South, KL',
    contact_person: 'Ahmad Taufiq',
    contact_person_phone: '085-283301',
    email: 'taufiq@edgenta.com',
    status: 'active'
  },
  {
    id: 'sup-2',
    hospital_id: DEFAULT_HOSPITAL_ID,
    supplier_code: 'SUP-002',
    company_name: 'Pembekal Makanan Segar Jaya Sdn Bhd',
    address: 'Lot 42, Kawasan Perindustrian Lawas, Sarawak',
    contact_person: 'Puan Halimah',
    contact_person_phone: '085-284555',
    email: 'segarjaya@gmail.com',
    status: 'active'
  },
  {
    id: 'sup-3',
    hospital_id: DEFAULT_HOSPITAL_ID,
    supplier_code: 'SUP-003',
    company_name: 'Linde Malaysia Sdn Bhd',
    address: 'No. 1, Jalan 215, Section 51, Petaling Jaya',
    contact_person: 'Robert Ling',
    contact_person_phone: '03-79554233',
    email: 'order.my@linde.com',
    status: 'active'
  }
]

export const DEFAULT_ADMIN_PURCHASE_ORDERS: AdminPurchaseOrder[] = [
  {
    id: 'po-1',
    hospital_id: DEFAULT_HOSPITAL_ID,
    order_number: 'PO-2026-0042',
    supplier_id: 'sup-1',
    order_date: '2026-02-01',
    expected_delivery_date: '2026-02-28',
    total_amount: 103380.0,
    status: 'approved',
    created_by: '21fbce58-1b02-4b8b-9147-1d063546b45b',
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000,29000',
    budget_type: 'pembangunan',
    fiscal_year: 2026,
    supplier: DEFAULT_ADMIN_SUPPLIERS[0],
    items: [
      {
        id: 'poi-1',
        purchase_order_id: 'po-1',
        item_description: 'Bayaran Sewaan Peralatan Perubatan Bulan Februari 2026',
        quantity: 1,
        unit_price: 103380.0,
        total_price: 103380.0,
        unit: 'bulan'
      }
    ]
  },
  {
    id: 'po-2',
    hospital_id: DEFAULT_HOSPITAL_ID,
    order_number: 'PO-2026-0041',
    supplier_id: 'sup-2',
    order_date: '2026-02-05',
    expected_delivery_date: '2026-02-15',
    total_amount: 45000.0,
    status: 'completed',
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf',
    program_code: '022300',
    objek_code: '25000',
    kategori_code: '25000',
    budget_type: 'warrant',
    fiscal_year: 2026,
    supplier: DEFAULT_ADMIN_SUPPLIERS[1],
    items: [
      {
        id: 'poi-2',
        purchase_order_id: 'po-2',
        item_description: 'Bekalan Bahan Mentah Makanan Pesakit Wad (Beras, Daging, Ikan)',
        quantity: 1,
        unit_price: 45000.0,
        total_price: 45000.0,
        unit: 'pakej'
      }
    ]
  },
  {
    id: 'po-3',
    hospital_id: DEFAULT_HOSPITAL_ID,
    order_number: 'PO-2026-0040',
    supplier_id: 'sup-3',
    order_date: '2026-02-10',
    expected_delivery_date: '2026-02-20',
    total_amount: 14500.0,
    status: 'pending_approval',
    created_by: '21fbce58-1b02-4b8b-9147-1d063546b45b',
    program_code: '020200',
    objek_code: '24000',
    kategori_code: '24999',
    budget_type: 'warrant',
    fiscal_year: 2026,
    supplier: DEFAULT_ADMIN_SUPPLIERS[2],
    items: [
      {
        id: 'poi-3',
        purchase_order_id: 'po-3',
        item_description: 'Sewaan Silinder Gas Perubatan Cecair (Linde) Q1 2026',
        quantity: 1,
        unit_price: 14500.0,
        total_price: 14500.0,
        unit: 'suku tahun'
      }
    ]
  }
]

export const DEFAULT_ADMIN_LPOS: AdminLPO[] = [
  {
    id: 'lpo-1',
    hospital_id: DEFAULT_HOSPITAL_ID,
    lpo_number: 'LPO/KKM/2026/0042',
    purchase_order_id: 'po-1',
    lpo_date: '2026-02-02',
    status: 'generated',
    created_by: '21fbce58-1b02-4b8b-9147-1d063546b45b',
    purchase_order: DEFAULT_ADMIN_PURCHASE_ORDERS[0]
  },
  {
    id: 'lpo-2',
    hospital_id: DEFAULT_HOSPITAL_ID,
    lpo_number: 'LPO/KKM/2026/0041',
    purchase_order_id: 'po-2',
    lpo_date: '2026-02-06',
    status: 'completed',
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf',
    purchase_order: DEFAULT_ADMIN_PURCHASE_ORDERS[1]
  }
]

export const DEFAULT_ADMIN_PAYMENTS: AdminPayment[] = [
  {
    id: 'pay-1',
    hospital_id: DEFAULT_HOSPITAL_ID,
    lpo_id: 'lpo-2',
    payment_date: '2026-02-12',
    payment_reference: 'EFT-KKM-2026-88192',
    amount: 45000.0,
    status: 'paid',
    created_by: '91545cb0-c4ee-4713-bf0f-c3d91a4fceaf',
    lpo: DEFAULT_ADMIN_LPOS[1]
  }
]

// -----------------------------------------------------------------------------
// SERVICE METHODS WITH SMART MERGE & FALLBACK
// -----------------------------------------------------------------------------

export async function getAdminHierarchy(hospitalId?: string) {
  try {
    const [progRes, objRes, katRes] = await Promise.all([
      supabase.from('admin_programs').select('*').order('code', { ascending: true }),
      supabase.from('admin_objeks').select('*').order('code', { ascending: true }),
      supabase.from('admin_kategoris').select('*').order('code', { ascending: true })
    ])

    const programs = progRes.data && progRes.data.length > 0 ? (progRes.data as AdminProgram[]) : DEFAULT_ADMIN_PROGRAMS
    const objeks = objRes.data && objRes.data.length > 0 ? (objRes.data as AdminObjek[]) : DEFAULT_ADMIN_OBJEKS
    const kategoris = katRes.data && katRes.data.length > 0 ? (katRes.data as AdminKategori[]) : DEFAULT_ADMIN_KATEGORIS

    return { programs, objeks, kategoris }
  } catch (error) {
    console.warn('Using default hierarchy fallback:', error)
    return {
      programs: DEFAULT_ADMIN_PROGRAMS,
      objeks: DEFAULT_ADMIN_OBJEKS,
      kategoris: DEFAULT_ADMIN_KATEGORIS
    }
  }
}

export async function getWarrants(filters?: { hospitalId?: string; fiscalYear?: number; programCode?: string }) {
  try {
    let query = supabase.from('admin_warrants').select('*').order('warrant_date', { ascending: false })

    if (filters?.fiscalYear) {
      query = query.eq('fiscal_year', filters.fiscalYear)
    }
    if (filters?.programCode) {
      query = query.eq('program_code', filters.programCode)
    }

    const { data, error } = await query
    if (error || !data || data.length === 0) {
      return DEFAULT_ADMIN_WARRANTS
    }
    return data as AdminWarrant[]
  } catch (error) {
    return DEFAULT_ADMIN_WARRANTS
  }
}

export async function getPembangunan(filters?: { hospitalId?: string; fiscalYear?: number }) {
  try {
    let query = supabase.from('admin_pembangunan').select('*').order('pembangunan_date', { ascending: false })

    if (filters?.fiscalYear) {
      query = query.eq('fiscal_year', filters.fiscalYear)
    }

    const { data, error } = await query
    if (error || !data || data.length === 0) {
      return DEFAULT_ADMIN_PEMBANGUNAN
    }
    return data as AdminPembangunan[]
  } catch (error) {
    return DEFAULT_ADMIN_PEMBANGUNAN
  }
}

export async function addWarrantInflow(warrant: Partial<AdminWarrant>) {
  try {
    const payload = {
      hospital_id: warrant.hospital_id || DEFAULT_HOSPITAL_ID,
      warrant_date: warrant.warrant_date || new Date().toISOString().split('T')[0],
      document_no: warrant.document_no,
      vote_code: warrant.vote_code || warrant.objek_code || '25000',
      vote_activity: warrant.vote_activity || warrant.program_code || '022300',
      category: warrant.category || warrant.kategori_code || '25000',
      amount: Number(warrant.amount) || 0,
      description: warrant.description || '',
      program_code: warrant.program_code,
      objek_code: warrant.objek_code,
      kategori_code: warrant.kategori_code,
      fiscal_year: warrant.fiscal_year || new Date().getFullYear(),
      created_by: warrant.created_by
    }

    const { data, error } = await supabase.from('admin_warrants').insert([payload]).select().single()
    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error adding warrant:', error)
    return { data: null, error }
  }
}

export async function addPembangunanInflow(pemb: Partial<AdminPembangunan>) {
  try {
    const payload = {
      hospital_id: pemb.hospital_id || DEFAULT_HOSPITAL_ID,
      document_no: pemb.document_no,
      pembangunan_date: pemb.pembangunan_date || new Date().toISOString().split('T')[0],
      fiscal_year: pemb.fiscal_year || new Date().getFullYear(),
      program_code: 'P42',
      objek_code: pemb.objek_code,
      kategori_code: pemb.kategori_code,
      amount: Number(pemb.amount) || 0,
      description: pemb.description || '',
      created_by: pemb.created_by
    }

    const { data, error } = await supabase.from('admin_pembangunan').insert([payload]).select().single()
    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error adding pembangunan:', error)
    return { data: null, error }
  }
}

export async function getPurchaseOrders(filters?: {
  hospitalId?: string
  status?: string
  budgetType?: string
  fiscalYear?: number
}) {
  try {
    let query = supabase
      .from('admin_purchase_orders')
      .select(`
        *,
        supplier:admin_suppliers(*),
        items:admin_purchase_order_items(*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters?.budgetType && filters.budgetType !== 'all') {
      query = query.eq('budget_type', filters.budgetType)
    }
    if (filters?.fiscalYear) {
      query = query.eq('fiscal_year', filters.fiscalYear)
    }

    const { data, error } = await query
    if (error || !data || data.length === 0) {
      return DEFAULT_ADMIN_PURCHASE_ORDERS
    }
    return data as AdminPurchaseOrder[]
  } catch (error) {
    return DEFAULT_ADMIN_PURCHASE_ORDERS
  }
}

export async function createPurchaseOrder(
  po: Partial<AdminPurchaseOrder>,
  items: AdminPurchaseOrderItem[]
) {
  try {
    const hid = po.hospital_id || DEFAULT_HOSPITAL_ID
    const fiscalYear = po.fiscal_year || new Date().getFullYear()
    const orderNumber = po.order_number || `PO-${fiscalYear}-${Date.now().toString().slice(-5)}`

    const poPayload = {
      hospital_id: hid,
      order_number: orderNumber,
      supplier_id: po.supplier_id || null,
      order_date: po.order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: po.expected_delivery_date || null,
      total_amount: Number(po.total_amount) || 0,
      status: po.status || 'pending_approval',
      created_by: po.created_by,
      notes: po.notes || null,
      program_code: po.program_code,
      objek_code: po.objek_code,
      kategori_code: po.kategori_code,
      budget_type: po.budget_type,
      fiscal_year: fiscalYear
    }

    const { data: createdPO, error: poErr } = await supabase
      .from('admin_purchase_orders')
      .insert([poPayload])
      .select()
      .single()

    if (poErr) throw poErr

    if (items && items.length > 0) {
      const itemsPayload = items.map((item) => ({
        purchase_order_id: createdPO.id,
        perihal_id: item.perihal_id || null,
        item_description: item.item_description,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        total_price: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
        specifications: item.specifications || null,
        program_code: po.program_code,
        objek_code: po.objek_code,
        kategori_code: po.kategori_code,
        unit: item.unit || 'unit'
      }))

      await supabase.from('admin_purchase_order_items').insert(itemsPayload)
    }

    return { data: createdPO, error: null }
  } catch (error: any) {
    console.error('Error creating purchase order:', error)
    return { data: null, error }
  }
}

export async function updatePurchaseOrderStatus(
  poId: string,
  status: POStatus,
  approvedBy?: string
) {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved' && approvedBy) {
      updateData.approved_by = approvedBy
      updateData.approved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('admin_purchase_orders')
      .update(updateData)
      .eq('id', poId)
      .select()
      .single()

    if (error) throw error

    if (status === 'approved' && approvedBy) {
      await generateLPO(poId, approvedBy)
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error updating PO status:', error)
    return { data: null, error }
  }
}

export async function generateLPO(poId: string, createdBy: string, customLpoNo?: string) {
  try {
    const fiscalYear = new Date().getFullYear()
    const lpoNumber = customLpoNo || `LPO/KKM/${fiscalYear}/${Date.now().toString().slice(-4)}`

    const { data: existing } = await supabase
      .from('admin_lpos')
      .select('id')
      .eq('purchase_order_id', poId)
      .maybeSingle()

    if (existing) {
      return { data: existing, error: null }
    }

    const payload = {
      hospital_id: DEFAULT_HOSPITAL_ID,
      purchase_order_id: poId,
      lpo_number: lpoNumber,
      lpo_date: new Date().toISOString().split('T')[0],
      document_date: new Date().toISOString().split('T')[0],
      status: 'generated',
      created_by: createdBy
    }

    const { data, error } = await supabase.from('admin_lpos').insert([payload]).select().single()
    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error generating LPO:', error)
    return { data: null, error }
  }
}

export async function getLPOs(hospitalId?: string) {
  try {
    const { data, error } = await supabase
      .from('admin_lpos')
      .select(`
        *,
        purchase_order:admin_purchase_orders(
          *,
          supplier:admin_suppliers(*),
          items:admin_purchase_order_items(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return DEFAULT_ADMIN_LPOS
    }
    return data as AdminLPO[]
  } catch (error) {
    return DEFAULT_ADMIN_LPOS
  }
}

export async function getReceivingRecords(hospitalId?: string) {
  try {
    const { data, error } = await supabase
      .from('admin_receiving_records')
      .select(`
        *,
        items:admin_receiving_items(*),
        lpo:admin_lpos(
          *,
          purchase_order:admin_purchase_orders(
            *,
            supplier:admin_suppliers(*)
          )
        )
      `)
      .order('received_date', { ascending: false })

    if (error || !data) return []
    return data as AdminReceivingRecord[]
  } catch (error) {
    return []
  }
}

export async function getPayments(hospitalId?: string) {
  try {
    const { data, error } = await supabase
      .from('admin_payments')
      .select(`
        *,
        lpo:admin_lpos(
          *,
          purchase_order:admin_purchase_orders(
            *,
            supplier:admin_suppliers(*)
          )
        )
      `)
      .order('payment_date', { ascending: false })

    if (error || !data || data.length === 0) {
      return DEFAULT_ADMIN_PAYMENTS
    }
    return data as AdminPayment[]
  } catch (error) {
    return DEFAULT_ADMIN_PAYMENTS
  }
}

export async function recordPayment(payment: Partial<AdminPayment>) {
  try {
    const payload = {
      hospital_id: payment.hospital_id || DEFAULT_HOSPITAL_ID,
      lpo_id: payment.lpo_id,
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      payment_reference: payment.payment_reference || `EFT-KKM-${Date.now().toString().slice(-6)}`,
      amount: Number(payment.amount) || 0,
      status: payment.status || 'paid',
      created_by: payment.created_by
    }

    const { data, error } = await supabase.from('admin_payments').insert([payload]).select().single()
    if (error) throw error

    if (payment.lpo_id) {
      const { data: lpoData } = await supabase
        .from('admin_lpos')
        .select('purchase_order_id')
        .eq('id', payment.lpo_id)
        .single()

      if (lpoData?.purchase_order_id) {
        await supabase.from('admin_purchase_orders').update({ status: 'completed' }).eq('id', lpoData.purchase_order_id)
      }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error recording payment:', error)
    return { data: null, error }
  }
}

export async function getSuppliers(hospitalId?: string) {
  try {
    const { data, error } = await supabase.from('admin_suppliers').select('*').order('company_name', { ascending: true })
    if (error || !data || data.length === 0) {
      return DEFAULT_ADMIN_SUPPLIERS
    }
    return data as AdminSupplier[]
  } catch (error) {
    return DEFAULT_ADMIN_SUPPLIERS
  }
}

export const DEFAULT_ADMIN_PERIHAL_CATALOG: AdminPerihalItem[] = [
  {
    id: '0d1c0bc6-f8f1-4e39-a5c6-04c5ef18d49c',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '27000',
    kategori_code: '27000',
    perihal_name: 'Bekalan Pejabat',
    description: 'Bekalan alat tulis dan kelengkapan am pejabat pentadbiran',
    unit_price: 0.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: 'd949385e-ead1-4c01-8f09-13d9bdc1f318',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '29000',
    kategori_code: '29199',
    perihal_name: 'Bacaan Merer (Hitam Putih)',
    description: 'Caj cetakan per salinan fotostat monokrom',
    unit_price: 0.03,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '456018eb-a9f4-4f7e-b027-ca3a79082ff5',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '29000',
    kategori_code: '29199',
    perihal_name: 'Bacaan Merer (Berwarna)',
    description: 'Caj cetakan per salinan fotostat berwarna',
    unit_price: 0.40,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '1d77d2e6-6c72-482f-9c44-b703f25fff21',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000, 29000',
    perihal_name: 'BEMS - Biomedical Engineering Maintenance Services',
    description: 'Penyelenggaraan berkala peralatan biomedikal hospital konsesi',
    unit_price: 31000.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: 'de029abb-b351-4b47-b1af-321ef2eb2dc3',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000, 29000',
    perihal_name: 'CLS - Cleansing Services',
    description: 'Perkhidmatan pembersihan dan sanitasi fasiliti klinikal',
    unit_price: 31000.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: 'e16b00ef-9f2f-4cce-abff-b769c9336146',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Diet Blenderised',
    description: 'Sajian khas makanan cair berkhasiat pesakit',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: 'f9bad0a0-8cb2-4a2a-8f11-c8cdcf9677d4',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Diet Blenderised',
    description: 'Sajian khas makanan cair berkhasiat pesakit',
    unit_price: 6.00,
    unit: 'UNIT',
    meal_session: 'Makan Malam',
    is_active: true
  },
  {
    id: '9687f078-906d-4366-a7f8-3c444eef8bce',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Diet Blenderised',
    description: 'Sajian khas makanan cair berkhasiat pesakit',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Minum Petang',
    is_active: true
  },
  {
    id: '84078261-ce66-4d32-9475-9791bf4f5e67',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Diet Blenderised',
    description: 'Sajian khas makanan cair berkhasiat pesakit',
    unit_price: 6.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: '3cd94943-6608-4d44-96c3-44e6c22a3d87',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Diet minuman berkhasiat (SKOP)',
    description: 'Minuman suplemen nutrisi berformula skop',
    unit_price: 2.95,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: '7a2a4295-c267-4166-848a-ce8dfede220d',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Diet minuman berkhasiat (TIN)',
    description: 'Minuman enteral berformula khas dalam tin',
    unit_price: 58.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: '7e7225d3-8ff2-453d-8ee8-544cd914d630',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000, 29000',
    perihal_name: 'FEMS - Facility Engineering Maintenance Services',
    description: 'Penyelenggaraan fasiliti kejuruteraan bangunan hospital',
    unit_price: 72000.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '53c73ae5-336a-4e45-9fff-1b355388ff5d',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000, 29000',
    perihal_name: 'FMS - Facility Management Services',
    description: 'Pengurusan am fasiliti sokongan hospital',
    unit_price: 6000.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '5f3dcb51-be41-46ee-a114-58084ba35108',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000, 29000',
    perihal_name: 'HWMS/CWMS - Healthcare Waste Management Services / Clinical Waste',
    description: 'Pelupusan sisa klinikal berjadual mengikut standard KKM',
    unit_price: 15000.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: 'd8c9d548-5e5d-4bcc-8c54-1c2c78e2bd78',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-Kanak 1-6 tahun',
    description: 'Sajian pediatrik lengkap kanak-kanak',
    unit_price: 8.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: '70da0fb6-4958-4d62-8022-5741949df7c0',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-Kanak 1-6 tahun',
    description: 'Sajian sarapan pagi pediatrik',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: 'ac27e927-b861-4da6-b01f-4045fb4dd805',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-Kanak 1-6 tahun',
    description: 'Sajian minum petang pediatrik',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Minum Petang',
    is_active: true
  },
  {
    id: '3f194887-6098-4f58-97e9-a60e81cb4dd1',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-Kanak 1-6 tahun',
    description: 'Sajian makan malam pediatrik',
    unit_price: 8.00,
    unit: 'UNIT',
    meal_session: 'Makan Malam',
    is_active: true
  },
  {
    id: 'c4993848-877c-438e-a907-cf17d16da3ed',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-Kanak 6-12 bulan',
    description: 'Sajian makanan pejal bayi',
    unit_price: 7.00,
    unit: 'UNIT',
    meal_session: 'Makan Malam',
    is_active: true
  },
  {
    id: 'c318e07a-6ac7-42ac-a6f7-d0236ca75e6e',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-Kanak 6-12 Bulan',
    description: 'Sajian makanan pejal bayi tengah hari',
    unit_price: 7.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: 'deb473d0-f24c-4d69-862f-57669d86425d',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-Kanak 6-12 Bulan',
    description: 'Sajian sarapan pagi bayi',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: '736eee3d-1323-4d55-b5ae-6916e5cf8255',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-kanak 7-12 tahun',
    description: 'Sajian minum petang kanak-kanak sekolah',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Minum Petang',
    is_active: true
  },
  {
    id: '5045e53c-0312-41a6-8976-3fc6c8a0a305',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-kanak 7-12 tahun',
    description: 'Sajian sarapan pagi kanak-kanak sekolah',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: '154f71c7-a4e3-43b6-b255-fb6c3f138314',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-kanak 7-12 tahun',
    description: 'Sajian makan tengah hari kanak-kanak sekolah',
    unit_price: 8.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: '287d2952-0d85-499a-a455-d586d06b2907',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kanak-kanak 7-12 tahun',
    description: 'Sajian makan malam kanak-kanak sekolah',
    unit_price: 8.00,
    unit: 'UNIT',
    meal_session: 'Makan Malam',
    is_active: true
  },
  {
    id: 'd7a43998-0aaf-4673-891e-61cd8a374ffa',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kelas 1',
    description: 'Sajian diet pesakit wad Kelas 1 makan malam',
    unit_price: 10.00,
    unit: 'UNIT',
    meal_session: 'Makan Malam',
    is_active: true
  },
  {
    id: '64796eb7-4760-4cc6-8c06-b501e1dc56d6',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kelas 1',
    description: 'Sajian sarapan pagi pesakit wad Kelas 1',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: 'e7365805-a0aa-473f-807c-acf2da1d94e1',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kelas 1',
    description: 'Sajian minum petang pesakit wad Kelas 1',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Minum Petang',
    is_active: true
  },
  {
    id: '0c863784-da51-4db9-a5f6-f44b56d1827d',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kelas 1',
    description: 'Sajian makan tengah hari pesakit wad Kelas 1',
    unit_price: 10.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: '57ca473a-0f75-4a8e-ab17-7e1cbc4e2ecd',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kelas 3 & MAC',
    description: 'Sajian makan malam pesakit Kelas 3 & MAC',
    unit_price: 12.50,
    unit: 'UNIT',
    meal_session: 'Makan Malam',
    is_active: true
  },
  {
    id: '78eeda55-a0c1-421b-a6a4-d449b4d76aaf',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kelas 3 & MAC',
    description: 'Sajian sarapan pagi pesakit Kelas 3 & MAC',
    unit_price: 6.00,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: 'ca8d2fae-ae77-482d-81f6-b2daa6ba5602',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kelas 3 & MAC',
    description: 'Sajian makan tengah hari pesakit Kelas 3 & MAC',
    unit_price: 12.50,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: 'caaf7f0e-dc60-4136-ac1a-9c2f2207ea89',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Kelas 3 & MAC',
    description: 'Sajian minum petang pesakit Kelas 3 & MAC',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Minum Petang',
    is_active: true
  },
  {
    id: 'cacef794-e191-4880-b690-87aae7452c81',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01200 117 1002',
    kategori_code: '28000, 29000',
    perihal_name: 'LLS - Linen and Laundry Services',
    description: 'Perkhidmatan dobi dan pembersihan linen hospital',
    unit_price: 25000.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '766f31f3-9693-4002-a392-643f52399e79',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Makan Tengah Hari',
    description: 'Membekal diet doctor OT dan paramedik semasa prosedur',
    unit_price: 14.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: 'fb896770-3908-499e-b69c-8cdd3a865f3d',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Makan Tengah Hari',
    description: 'Membekal Diet Doctor on call bertugas',
    unit_price: 16.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  },
  {
    id: '96b60a8d-3f53-4bee-9f10-ac126c273b68',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Makan Tengah Malam',
    description: 'Membekal diet doctor OT dan paramedik sesi kecemasan malam',
    unit_price: 14.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Malam',
    is_active: true
  },
  {
    id: '28e4aa5b-b9ca-4970-a3cd-e332f74aedf0',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Makan Tengah Malam',
    description: 'Membekal Diet Doctor on call syif malam',
    unit_price: 16.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Malam',
    is_active: true
  },
  {
    id: 'e307031f-6e8b-4d5a-9fef-918655d5089b',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '29000',
    kategori_code: '29122',
    perihal_name: 'Perkhidmatan Kawalan Keselamatan Tanpa Senjata Hospital Lawas',
    description: 'Kawalan keselamatan premis hospital 24 jam berpusat',
    unit_price: 68205.56,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: 'a7af04f5-fe5a-43c1-aae2-fdd96608d0f8',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Perkhidmatan Persediaan Makanan',
    description: 'Perkhidmatan pemprosesan dan penyediaan sajian basah',
    unit_price: 0.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '6b2f3ec7-2206-4d8f-b572-0729b5e26f60',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '24000',
    kategori_code: '24699',
    perihal_name: 'Perkhidmatan Sewaan 2 unit Mesin Penyalin',
    description: 'Sewaan bulanan mesin pencetak & fotostat pelbagai fungsi',
    unit_price: 764.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '2ec2b0d3-01fb-4edb-93e9-7e0faf37cb50',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Sarapan Pagi',
    description: 'Membekal Diet Doctor on call pagi',
    unit_price: 8.50,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: 'f3e4bbe4-54fa-468d-852b-53e504ad3129',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '24000',
    kategori_code: '24202',
    perihal_name: 'Sewaan Bangunan Decanting LOT 339',
    description: 'Sewaan premis transit fasiliti perubatan zon 339',
    unit_price: 5565.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '56d9aae3-e236-4dd7-bfbe-ff2f143f57fe',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '24000',
    kategori_code: '24202',
    perihal_name: 'Sewaan Bangunan Decanting LOT 340',
    description: 'Sewaan premis transit fasiliti perubatan zon 340',
    unit_price: 5830.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '8a68e194-d2e0-4349-8500-613f6eddb61f',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '24000',
    kategori_code: '24202',
    perihal_name: 'Sewaan Bangunan Decanting LOT 341',
    description: 'Sewaan premis transit fasiliti perubatan zon 341',
    unit_price: 5830.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '5c4bb909-5a65-4b99-bd05-41090ec8ad55',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '24000',
    kategori_code: '24202',
    perihal_name: 'Sewaan Bangunan Decanting LOT 342',
    description: 'Sewaan premis transit fasiliti perubatan zon 342',
    unit_price: 7420.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '34e75a00-0aff-4fcc-b05c-3c435faf4c62',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '020200',
    objek_code: '24000',
    kategori_code: '24999',
    perihal_name: 'Sewaan Gas Perubatan',
    description: 'Kadar caj sewaan berkala bekalan silinder gas oksigen & anestesia',
    unit_price: 18.36,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '21fb43d2-5df5-4cf7-b413-23391e5c50e0',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01100 117 4002',
    kategori_code: '24000',
    perihal_name: 'Sewaan Mesin GA Machine With Patient Monitor',
    description: 'Sewaan mesin bius am (General Anaesthesia) berteknologi tinggi',
    unit_price: 4023.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: '996a6dfe-4a84-489b-8a3f-26f9e6330404',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01100 117 4002',
    kategori_code: '24000',
    perihal_name: 'Sewaan Mesin Haemodialisis',
    description: 'Sewaan mesin rawatan buah pinggang pesakit (Leasing 3.0)',
    unit_price: 1033.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: 'd2a4d0d3-addd-4624-ae4e-0c2a6cfc1685',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: 'P42',
    objek_code: '01100 117 4002',
    kategori_code: '24000',
    perihal_name: 'Sewaan Mesin Ultrasound Medium End Radio',
    description: 'Sewaan mesin imbasan sonografi diagnostik radiologi',
    unit_price: 3599.00,
    unit: 'UNIT',
    meal_session: null,
    is_active: true
  },
  {
    id: 'cd0c14eb-926e-4ba1-af77-5ee09fb7769a',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Terapeutik Diet',
    description: 'Sajian diet pemulihan klinikal pesakit',
    unit_price: 6.00,
    unit: 'UNIT',
    meal_session: 'Sarapan Pagi',
    is_active: true
  },
  {
    id: '9235884c-29a5-4e63-bb49-7fba37500654',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Terapeutik Diet',
    description: 'Sajian diet pemulihan klinikal pesakit',
    unit_price: 13.00,
    unit: 'UNIT',
    meal_session: 'Makan Malam',
    is_active: true
  },
  {
    id: 'b734f04b-cc1a-4570-9777-8bfd4b154332',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Terapeutik Diet',
    description: 'Sajian diet pemulihan klinikal pesakit',
    unit_price: 4.00,
    unit: 'UNIT',
    meal_session: 'Minum Petang',
    is_active: true
  },
  {
    id: '12320978-9c46-4fd9-94b8-259caa1e207b',
    hospital_id: DEFAULT_HOSPITAL_ID,
    program_code: '022300',
    objek_code: '29000',
    kategori_code: '29126',
    perihal_name: 'Terapeutik Diet',
    description: 'Sajian diet pemulihan klinikal pesakit',
    unit_price: 13.00,
    unit: 'UNIT',
    meal_session: 'Makan Tengah Hari',
    is_active: true
  }
]

export async function getPerihalCatalog(filters?: {
  hospitalId?: string
  programCode?: string
  objekCode?: string
  kategoriCode?: string
}) {
  try {
    let query = supabase.from('admin_perihal_catalog').select('*').eq('is_active', true).order('perihal_name', { ascending: true })

    if (filters?.programCode) query = query.eq('program_code', filters.programCode)
    if (filters?.objekCode) query = query.eq('objek_code', filters.objekCode)
    if (filters?.kategoriCode) query = query.eq('kategori_code', filters.kategoriCode)

    const { data, error } = await query
    if (error || !data || data.length === 0) {
      // Filter defaults
      return DEFAULT_ADMIN_PERIHAL_CATALOG.filter((item) => {
        if (filters?.programCode && item.program_code !== filters.programCode) return false
        if (filters?.objekCode && item.objek_code !== filters.objekCode) return false
        if (filters?.kategoriCode && item.kategori_code !== filters.kategoriCode) return false
        return true
      })
    }
    return data as AdminPerihalItem[]
  } catch (error) {
    return DEFAULT_ADMIN_PERIHAL_CATALOG
  }
}

export async function createPerihalItem(item: Partial<AdminPerihalItem>) {
  try {
    const payload = {
      hospital_id: item.hospital_id || DEFAULT_HOSPITAL_ID,
      program_code: item.program_code || '020200',
      objek_code: item.objek_code || '29000',
      kategori_code: item.kategori_code || '29126',
      perihal_name: item.perihal_name || '',
      description: item.description || '',
      unit_price: Number(item.unit_price) || 0,
      unit: item.unit || 'UNIT',
      meal_session: item.meal_session || null,
      is_active: item.is_active !== undefined ? item.is_active : true,
      created_by: item.created_by
    }

    const { data, error } = await supabase.from('admin_perihal_catalog').insert([payload]).select().single()
    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error creating perihal item:', error)
    return { data: null, error }
  }
}

export async function updatePerihalItem(id: string, updates: Partial<AdminPerihalItem>) {
  try {
    const payload: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    if (updates.unit_price !== undefined) {
      payload.unit_price = Number(updates.unit_price)
    }

    const { data, error } = await supabase
      .from('admin_perihal_catalog')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error updating perihal item:', error)
    return { data: null, error }
  }
}

export async function deletePerihalItem(id: string) {
  try {
    const { error } = await supabase
      .from('admin_perihal_catalog')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Error deleting perihal item:', error)
    return { error }
  }
}

export async function getAggregatedPerolehanData(fiscalYear?: number): Promise<{
  kpis: OverallPerolehanKPIs
  hierarchy: BudgetHierarchySummary[]
  recentOrders: AdminPurchaseOrder[]
  warrants: AdminWarrant[]
  pembangunan: AdminPembangunan[]
}> {
  const currentYear = fiscalYear || 2026

  const [
    hierarchyData,
    warrantsList,
    pembangunanList,
    ordersList,
    paymentsList,
    suppliersList
  ] = await Promise.all([
    getAdminHierarchy(),
    getWarrants({ fiscalYear: currentYear }),
    getPembangunan({ fiscalYear: currentYear }),
    getPurchaseOrders({ fiscalYear: currentYear }),
    getPayments(),
    getSuppliers()
  ])

  const { programs, objeks, kategoris } = hierarchyData

  const totalAllocatedPengurusan = warrantsList.reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
  const totalAllocatedPembangunan = pembangunanList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const totalAllocatedGrand = totalAllocatedPengurusan + totalAllocatedPembangunan

  let totalCommitted = 0
  let totalActualSpent = 0

  ordersList.forEach((order) => {
    const amt = Number(order.total_amount) || 0
    if (order.status === 'completed') {
      totalActualSpent += amt
    } else if (order.status !== 'cancelled') {
      totalCommitted += amt
    }
  })

  const totalNetBalance = Math.max(0, totalAllocatedGrand - totalCommitted - totalActualSpent)
  const overallUtilizationRate = totalAllocatedGrand > 0
    ? Math.min(100, Math.round(((totalCommitted + totalActualSpent) / totalAllocatedGrand) * 100))
    : 0

  const activePOCount = ordersList.filter((o) => o.status !== 'cancelled' && o.status !== 'completed').length
  const pendingApprovalCount = ordersList.filter((o) => o.status === 'pending_approval').length

  const kpis: OverallPerolehanKPIs = {
    totalAllocatedPengurusan,
    totalAllocatedPembangunan,
    totalAllocatedGrand,
    totalCommitted,
    totalActualSpent,
    totalNetBalance,
    overallUtilizationRate,
    activePOCount,
    pendingApprovalCount,
    totalSuppliersCount: suppliersList.length,
    fiscalYear: currentYear
  }

  const hierarchy: BudgetHierarchySummary[] = programs.map((prog) => {
    const isWarrant = prog.budget_type === 'warrant'

    const progAllocated = isWarrant
      ? warrantsList
          .filter((w) => w.program_code === prog.code || w.vote_activity === prog.code)
          .reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
      : pembangunanList
          .filter((p) => p.program_code === prog.code)
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const progOrders = ordersList.filter((o) => o.program_code === prog.code)
    const progCommitted = progOrders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'completed')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

    const progSpent = progOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

    const progRemaining = Math.max(0, progAllocated - progCommitted - progSpent)
    const progUtilRate = progAllocated > 0
      ? Math.min(100, Math.round(((progCommitted + progSpent) / progAllocated) * 100))
      : 0

    const progObjeks = objeks.filter((obj) => obj.program_id === prog.id)
    const objekSummaries = progObjeks.map((obj) => {
      const objAllocated = isWarrant
        ? warrantsList
            .filter((w) => (w.objek_code === obj.code || w.vote_code === obj.code) && (w.program_code === prog.code || w.vote_activity === prog.code))
            .reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
        : pembangunanList
            .filter((p) => (p.objek_code === obj.code || obj.code.startsWith(p.objek_code?.slice(0, 5) || '')))
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

      const objOrders = progOrders.filter((o) => o.objek_code === obj.code)
      const objCommitted = objOrders
        .filter((o) => o.status !== 'cancelled' && o.status !== 'completed')
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

      const objSpent = objOrders
        .filter((o) => o.status === 'completed')
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

      const objRemaining = Math.max(0, objAllocated - objCommitted - objSpent)
      const objUtilRate = objAllocated > 0
        ? Math.min(100, Math.round(((objCommitted + objSpent) / objAllocated) * 100))
        : 0

      const objKategoris = kategoris.filter((k) => k.objek_id === obj.id)
      const kategoriSummaries = objKategoris.map((kat) => {
        const katAllocated = isWarrant
          ? warrantsList
              .filter((w) => (w.kategori_code === kat.code || w.category === kat.code))
              .reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
          : pembangunanList
              .filter((p) => p.kategori_code === kat.code)
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

        const katOrders = objOrders.filter((o) => o.kategori_code === kat.code)
        const katCommitted = katOrders
          .filter((o) => o.status !== 'cancelled' && o.status !== 'completed')
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

        const katSpent = katOrders
          .filter((o) => o.status === 'completed')
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

        const katRemaining = Math.max(0, katAllocated - katCommitted - katSpent)
        const katUtilRate = katAllocated > 0
          ? Math.min(100, Math.round(((katCommitted + katSpent) / katAllocated) * 100))
          : 0

        return {
          kategoriCode: kat.code,
          kategoriLabel: kat.label,
          isShared: kat.is_shared_budget,
          budgetGroupCode: kat.budget_group_code,
          totalAllocated: katAllocated,
          committedAmount: katCommitted,
          actualSpent: katSpent,
          remainingBalance: katRemaining,
          utilizationRate: katUtilRate
        }
      })

      return {
        objekCode: obj.code,
        objekLabel: obj.label,
        totalAllocated: objAllocated,
        committedAmount: objCommitted,
        actualSpent: objSpent,
        remainingBalance: objRemaining,
        utilizationRate: objUtilRate,
        kategoriSummaries
      }
    })

    return {
      programCode: prog.code,
      programLabel: prog.label,
      budgetType: prog.budget_type,
      totalAllocated: progAllocated,
      committedAmount: progCommitted,
      actualSpent: progSpent,
      remainingBalance: progRemaining,
      utilizationRate: progUtilRate,
      objekSummaries
    }
  })

  return {
    kpis,
    hierarchy,
    recentOrders: ordersList,
    warrants: warrantsList,
    pembangunan: pembangunanList
  }
}
