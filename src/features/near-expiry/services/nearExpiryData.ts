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
      expiry: addDays(65),
      daysLeft: 65,
      quantity: 150,
      unitCost: 4.25,
      totalValue: 637.50,
      priority: 'Medium'
    }
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
