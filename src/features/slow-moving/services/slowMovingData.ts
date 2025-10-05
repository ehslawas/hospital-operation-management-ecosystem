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
      currentStock: 80,
      daysOfInventory: 140,
      lastMovement: addDays(-30),
      unitCost: 12.75,
      totalValue: 1020.00,
      turnoverRate: 0.38,
      status: 'Warning'
    }
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
