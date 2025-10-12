export type NearExpiryKpis = {
  itemsExpiring30Days: number;
  itemsExpiring60Days: number;
  itemsExpiring90Days: number;
  totalValueAtRisk: number;
  criticalItemsCount: number;
  avgDaysToExpiry: number;
};

export type NearExpiryItem = {
  id: string;
  name: string;
  sku: string;
  category: 'Drug' | 'Non-drug';
  batch: string;
  expiry: string;
  daysLeft: number;
  quantity: number;
  unitCost: number;
  totalValue: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
};

export type ExpiryTimeline = {
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

export async function fetchNearExpiryKpis(): Promise<NearExpiryKpis> {
  // Mock KPI data for near-expiry items
  return {
    itemsExpiring30Days: 12,
    itemsExpiring60Days: 28,
    itemsExpiring90Days: 45,
    totalValueAtRisk: 125750,
    criticalItemsCount: 8,
    avgDaysToExpiry: 42,
  };
}

export async function fetchNearExpiryItems(): Promise<NearExpiryItem[]> {
  // Mock data for items nearing expiry
  const nearExpiryItems: NearExpiryItem[] = [
    {
      id: 'b5',
      name: 'Hydrocortisone 100mg Inj',
      sku: 'HYDRO-100-INJ',
      category: 'Drug',
      batch: 'HYDRO-2025-001',
      expiry: addDays(20),
      daysLeft: 20,
      quantity: 45,
      unitCost: 15.50,
      totalValue: 697.50,
      priority: 'Critical'
    },
    {
      id: 'b3',
      name: 'Amoxicillin 250mg Cap',
      sku: 'AMOX-250-CAP',
      category: 'Drug',
      batch: 'AMOX-2025-002',
      expiry: addDays(45),
      daysLeft: 45,
      quantity: 90,
      unitCost: 8.75,
      totalValue: 787.50,
      priority: 'High'
    },
    {
      id: 'b4',
      name: 'Normal Saline 500ml',
      sku: 'NS-500',
      category: 'Drug',
      batch: 'NS-2025-003',
      expiry: addDays(75),
      daysLeft: 75,
      quantity: 60,
      unitCost: 12.30,
      totalValue: 738.00,
      priority: 'Medium'
    },
    {
      id: 'b6',
      name: 'Zinc Sulfate 20mg',
      sku: 'ZINC-20',
      category: 'Drug',
      batch: 'ZINC-2025-004',
      expiry: addDays(50),
      daysLeft: 50,
      quantity: 95,
      unitCost: 6.80,
      totalValue: 646.00,
      priority: 'High'
    },
    {
      id: 'b7',
      name: 'Insulin Glargine 100u/ml',
      sku: 'INS-GLAR-100',
      category: 'Drug',
      batch: 'INS-2025-005',
      expiry: addDays(15),
      daysLeft: 15,
      quantity: 25,
      unitCost: 45.20,
      totalValue: 1130.00,
      priority: 'Critical'
    },
    {
      id: 'b8',
      name: 'Morphine 10mg Inj',
      sku: 'MORPH-10-INJ',
      category: 'Drug',
      batch: 'MORPH-2025-006',
      expiry: addDays(25),
      daysLeft: 25,
      quantity: 30,
      unitCost: 28.90,
      totalValue: 867.00,
      priority: 'Critical'
    },
    {
      id: 'b9',
      name: 'Epinephrine 1mg Inj',
      sku: 'EPI-1-INJ',
      category: 'Drug',
      batch: 'EPI-2025-007',
      expiry: addDays(35),
      daysLeft: 35,
      quantity: 20,
      unitCost: 35.75,
      totalValue: 715.00,
      priority: 'High'
    },
    {
      id: 'b10',
      name: 'Dexamethasone 4mg Tab',
      sku: 'DEXA-4-TAB',
      category: 'Drug',
      batch: 'DEXA-2025-008',
      expiry: addDays(65),
      daysLeft: 65,
      quantity: 150,
      unitCost: 4.25,
      totalValue: 637.50,
      priority: 'Medium'
    },
    {
      id: 'b11',
      name: 'Surgical Gloves Size M',
      sku: 'GLOVE-SURG-M',
      category: 'Non-drug',
      batch: 'GLOVE-2025-009',
      expiry: addDays(40),
      daysLeft: 40,
      quantity: 200,
      unitCost: 2.50,
      totalValue: 500.00,
      priority: 'High'
    },
    {
      id: 'b12',
      name: 'Alcohol Swab 70%',
      sku: 'ALC-SWAB-70',
      category: 'Non-drug',
      batch: 'ALC-2025-010',
      expiry: addDays(55),
      daysLeft: 55,
      quantity: 150,
      unitCost: 1.80,
      totalValue: 270.00,
      priority: 'Medium'
    },
    // extra items to ensure >= 20
    { id: 'b13', name: 'Gauze Pad 4x4', sku: 'GAUZE-4X4', category: 'Non-drug', batch: 'GAUZE-2025-011', expiry: addDays(70), daysLeft: 70, quantity: 300, unitCost: 0.75, totalValue: 225.00, priority: 'Medium' },
    { id: 'b14', name: 'Bandage Elastic 2in', sku: 'BAND-2IN', category: 'Non-drug', batch: 'BAND-2025-012', expiry: addDays(62), daysLeft: 62, quantity: 180, unitCost: 1.20, totalValue: 216.00, priority: 'Medium' },
    { id: 'b15', name: 'Syringe 5ml', sku: 'SYR-5ML', category: 'Non-drug', batch: 'SYR-2025-013', expiry: addDays(58), daysLeft: 58, quantity: 400, unitCost: 0.65, totalValue: 260.00, priority: 'Medium' },
    { id: 'b16', name: 'Mask Surgical 3-Ply', sku: 'MASK-3PLY', category: 'Non-drug', batch: 'MASK-2025-014', expiry: addDays(85), daysLeft: 85, quantity: 500, unitCost: 0.50, totalValue: 250.00, priority: 'Low' },
    { id: 'b17', name: 'Omeprazole 20mg Cap', sku: 'OMEP-20-CAP', category: 'Drug', batch: 'OMEP-2025-015', expiry: addDays(66), daysLeft: 66, quantity: 280, unitCost: 1.10, totalValue: 308.00, priority: 'Medium' },
    { id: 'b18', name: 'Metformin 500mg Tab', sku: 'MET-500-TAB', category: 'Drug', batch: 'MET-2025-016', expiry: addDays(77), daysLeft: 77, quantity: 320, unitCost: 0.90, totalValue: 288.00, priority: 'Medium' },
    { id: 'b19', name: 'Ibuprofen 200mg Tab', sku: 'IBU-200-TAB', category: 'Drug', batch: 'IBU-2025-017', expiry: addDays(73), daysLeft: 73, quantity: 380, unitCost: 0.80, totalValue: 304.00, priority: 'Medium' },
    { id: 'b20', name: 'Vitamin C 100mg Chewable', sku: 'VITC-100-CHEW', category: 'Drug', batch: 'VITC-2025-018', expiry: addDays(54), daysLeft: 54, quantity: 550, unitCost: 0.55, totalValue: 302.50, priority: 'High' },
    { id: 'b21', name: 'Paracetamol 500mg Tab', sku: 'PARA-500-TAB', category: 'Drug', batch: 'PARA-2025-019', expiry: addDays(52), daysLeft: 52, quantity: 600, unitCost: 0.40, totalValue: 240.00, priority: 'High' },
    { id: 'b22', name: 'Zinc Sulfate 20mg', sku: 'ZINC-20', category: 'Drug', batch: 'ZINC-2025-020', expiry: addDays(49), daysLeft: 49, quantity: 95, unitCost: 0.68, totalValue: 64.60, priority: 'High' }
  ];

  return nearExpiryItems;
}

export async function fetchExpiryTimeline(): Promise<ExpiryTimeline[]> {
  // Timeline of items expiring by month
  return [
    { time: '2025-10-01', value: 15 },
    { time: '2025-11-01', value: 12 },
    { time: '2025-12-01', value: 18 },
    { time: '2026-01-01', value: 8 },
    { time: '2026-02-01', value: 6 },
    { time: '2026-03-01', value: 4 },
  ];
}
