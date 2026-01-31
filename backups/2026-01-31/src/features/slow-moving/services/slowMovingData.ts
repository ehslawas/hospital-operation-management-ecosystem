export type SlowMovingKpis = {
  slowMovingItems: number;
  totalValueTiedUp: number;
  avgDaysOfInventory: number;
  itemsOver90Days: number;
  itemsOver180Days: number;
  turnoverRatio: number;
};

export type SlowMovingItem = {
  id: string;
  name: string;
  sku: string;
  category: 'Drug' | 'Non-drug';
  batch: string;
  expiry: string;
  currentStock: number;
  daysOfInventory: number;
  lastMovement: string;
  unitCost: number;
  totalValue: number;
  turnoverRate: number;
  status: 'Critical' | 'Warning' | 'Monitor' | 'Normal';
};

export type MovementTrend = {
  time: string;
  value: number;
};

// Use a fixed base date to keep SSR and client hydration deterministic
const BASE_DATE_ISO = process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T00:00:00Z';
const today = new Date(BASE_DATE_ISO);

const addDays = (d: number) => {
  const t = new Date(today);
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

export async function fetchSlowMovingKpis(): Promise<SlowMovingKpis> {
  // Mock KPI data for slow-moving items
  return {
    slowMovingItems: 24,
    totalValueTiedUp: 87500,
    avgDaysOfInventory: 156,
    itemsOver90Days: 18,
    itemsOver180Days: 8,
    turnoverRatio: 0.42,
  };
}

export async function fetchSlowMovingItems(): Promise<SlowMovingItem[]> {
  // Mock data for slow-moving items
  const slowMovingItems: SlowMovingItem[] = [
    {
      id: 'itm-g',
      name: 'Hydrocortisone 100mg Inj',
      sku: 'HYDRO-100-INJ',
      category: 'Drug',
      batch: 'HYDRO-2025-001',
      expiry: addDays(180),
      currentStock: 45,
      daysOfInventory: 180,
      lastMovement: addDays(-45),
      unitCost: 15.50,
      totalValue: 697.50,
      turnoverRate: 0.25,
      status: 'Critical'
    },
    {
      id: 'itm-k',
      name: 'Zinc Sulfate 20mg',
      sku: 'ZINC-20',
      category: 'Drug',
      batch: 'ZINC-2025-002',
      expiry: addDays(165),
      currentStock: 95,
      daysOfInventory: 165,
      lastMovement: addDays(-38),
      unitCost: 6.80,
      totalValue: 646.00,
      turnoverRate: 0.32,
      status: 'Critical'
    },
    {
      id: 'itm-c',
      name: 'Normal Saline 500ml',
      sku: 'NS-500',
      category: 'Drug',
      batch: 'NS-2025-003',
      expiry: addDays(120),
      currentStock: 60,
      daysOfInventory: 120,
      lastMovement: addDays(-25),
      unitCost: 12.30,
      totalValue: 738.00,
      turnoverRate: 0.45,
      status: 'Warning'
    },
    {
      id: 'itm-b',
      name: 'Amoxicillin 250mg Cap',
      sku: 'AMOX-250-CAP',
      category: 'Drug',
      batch: 'AMOX-2025-004',
      expiry: addDays(95),
      currentStock: 90,
      daysOfInventory: 95,
      lastMovement: addDays(-20),
      unitCost: 8.75,
      totalValue: 787.50,
      turnoverRate: 0.52,
      status: 'Warning'
    },
    {
      id: 'itm-o',
      name: 'Gloves Nitrile Large',
      sku: 'GLOVE-NIT-L',
      category: 'Non-drug',
      batch: 'GLOVE-2025-005',
      expiry: addDays(220),
      currentStock: 200,
      daysOfInventory: 220,
      lastMovement: addDays(-55),
      unitCost: 2.50,
      totalValue: 500.00,
      turnoverRate: 0.18,
      status: 'Critical'
    },
    {
      id: 'itm-p',
      name: 'Catheter Foley 16Fr',
      sku: 'CATH-FOLEY-16',
      category: 'Non-drug',
      batch: 'CATH-2025-006',
      expiry: addDays(185),
      currentStock: 150,
      daysOfInventory: 185,
      lastMovement: addDays(-42),
      unitCost: 8.90,
      totalValue: 1335.00,
      turnoverRate: 0.22,
      status: 'Critical'
    },
    {
      id: 'itm-q',
      name: 'Surgical Scissors',
      sku: 'SCISS-SURG',
      category: 'Non-drug',
      batch: 'SCISS-2025-007',
      expiry: addDays(365),
      currentStock: 25,
      daysOfInventory: 365,
      lastMovement: addDays(-120),
      unitCost: 45.00,
      totalValue: 1125.00,
      turnoverRate: 0.08,
      status: 'Critical'
    },
    {
      id: 'itm-r',
      name: 'Specialty Bandage 6in',
      sku: 'BAND-SPEC-6IN',
      category: 'Non-drug',
      batch: 'BAND-2025-008',
      expiry: addDays(140),
      currentStock: 80,
      daysOfInventory: 140,
      lastMovement: addDays(-30),
      unitCost: 12.75,
      totalValue: 1020.00,
      turnoverRate: 0.38,
      status: 'Warning'
    },
    // extras to reach 20+
    { id: 'itm-s', name: 'Disposable Cap', sku: 'CAP-DISP', category: 'Non-drug', batch: 'CAP-2025-009', expiry: addDays(200), currentStock: 500, daysOfInventory: 200, lastMovement: addDays(-35), unitCost: 0.30, totalValue: 150.00, turnoverRate: 0.20, status: 'Warning' },
    { id: 'itm-t', name: 'Thermometer Probe Covers', sku: 'THERM-PROBE', category: 'Non-drug', batch: 'THERM-2025-010', expiry: addDays(230), currentStock: 300, daysOfInventory: 230, lastMovement: addDays(-60), unitCost: 0.45, totalValue: 135.00, turnoverRate: 0.15, status: 'Critical' },
    { id: 'itm-u', name: 'Loperamide 2mg Tab', sku: 'LOP-2-TAB', category: 'Drug', batch: 'LOP-2025-011', expiry: addDays(140), currentStock: 220, daysOfInventory: 140, lastMovement: addDays(-33), unitCost: 0.55, totalValue: 121.00, turnoverRate: 0.38, status: 'Warning' },
    { id: 'itm-v', name: 'Ranitidine 150mg', sku: 'RAN-150', category: 'Drug', batch: 'RAN-2025-012', expiry: addDays(160), currentStock: 260, daysOfInventory: 160, lastMovement: addDays(-44), unitCost: 0.60, totalValue: 156.00, turnoverRate: 0.31, status: 'Warning' },
    { id: 'itm-w', name: 'Sodium Chloride 0.9% 1L', sku: 'NaCl-1L', category: 'Drug', batch: 'NACL-2025-013', expiry: addDays(125), currentStock: 180, daysOfInventory: 125, lastMovement: addDays(-27), unitCost: 1.50, totalValue: 270.00, turnoverRate: 0.50, status: 'Monitor' },
    { id: 'itm-x', name: 'Wheelchair Foot Rest', sku: 'WH-FR', category: 'Non-drug', batch: 'WH-2025-014', expiry: addDays(365), currentStock: 40, daysOfInventory: 365, lastMovement: addDays(-150), unitCost: 30.00, totalValue: 1200.00, turnoverRate: 0.08, status: 'Critical' },
    { id: 'itm-y', name: 'Sphygmomanometer Cuff', sku: 'SPHY-CUFF', category: 'Non-drug', batch: 'SPHY-2025-015', expiry: addDays(300), currentStock: 60, daysOfInventory: 300, lastMovement: addDays(-90), unitCost: 20.00, totalValue: 1200.00, turnoverRate: 0.10, status: 'Critical' },
    { id: 'itm-z', name: 'Tongue Depressor', sku: 'TONGUE-DEP', category: 'Non-drug', batch: 'TONG-2025-016', expiry: addDays(210), currentStock: 700, daysOfInventory: 210, lastMovement: addDays(-40), unitCost: 0.10, totalValue: 70.00, turnoverRate: 0.19, status: 'Warning' },
    { id: 'itm-aa', name: 'Cetirizine 10mg', sku: 'CET-10', category: 'Drug', batch: 'CET-2025-017', expiry: addDays(155), currentStock: 190, daysOfInventory: 155, lastMovement: addDays(-36), unitCost: 0.48, totalValue: 91.20, turnoverRate: 0.33, status: 'Warning' },
    { id: 'itm-ab', name: 'Guaifenesin Syrup', sku: 'GUA-100', category: 'Drug', batch: 'GUA-2025-018', expiry: addDays(145), currentStock: 130, daysOfInventory: 145, lastMovement: addDays(-28), unitCost: 2.40, totalValue: 312.00, turnoverRate: 0.41, status: 'Monitor' }
  ];

  return slowMovingItems;
}

export async function fetchMovementTrend(): Promise<MovementTrend[]> {
  // Movement trend for slow-moving items over time
  return [
    { time: '2025-04-01', value: 65 },
    { time: '2025-05-01', value: 58 },
    { time: '2025-06-01', value: 52 },
    { time: '2025-07-01', value: 48 },
    { time: '2025-08-01', value: 44 },
    { time: '2025-09-01', value: 38 },
  ];
}
