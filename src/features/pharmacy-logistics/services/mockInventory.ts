import type { PurchaseOrder } from '../components/MovementTable';
import type { FastMovingItem } from '../components/FastMovingTable';
import { getItems, getBatches, getMovements } from './dataStore';

export type DashboardKpis = {
  onHandSkus: number;
  lowStockCount: number;
  nearExpiryCount: number;
  inboundToday: number;
};

export type LowStockItem = {
  id: string;
  name: string;
  sku?: string;
  onHand: number;
  minLevel: number;
  deficit: number;
};

export type ExpiringBatch = {
  id: string;
  itemName: string;
  expiry: string; // ISO date
  daysLeft: number;
  quantity: number;
};

// Simple deterministic mock data set (server only)
type Item = {
  id: string;
  name: string;
  category: 'Drug' | 'Non-drug';
  minLevel: number;
  onHand: number;
};

type Batch = {
  id: string;
  itemId: string;
  quantity: number;
  expiry: string; // ISO date
};

const items: Item[] = [
  { id: 'itm-a', name: 'Paracetamol 500mg Tab', category: 'Drug', minLevel: 200, onHand: 1200 },
  { id: 'itm-b', name: 'Amoxicillin 250mg Cap', category: 'Drug', minLevel: 150, onHand: 90 },
  { id: 'itm-c', name: 'Normal Saline 500ml', category: 'Drug', minLevel: 80, onHand: 60 },
  { id: 'itm-d', name: 'Alcohol Swab', category: 'Non-drug', minLevel: 300, onHand: 520 },
  { id: 'itm-e', name: 'Syringe 5ml', category: 'Non-drug', minLevel: 400, onHand: 380 },
  { id: 'itm-f', name: 'Omeprazole 20mg Cap', category: 'Drug', minLevel: 200, onHand: 210 },
  { id: 'itm-g', name: 'Hydrocortisone 100mg Inj', category: 'Drug', minLevel: 60, onHand: 45 },
  { id: 'itm-h', name: 'Ibuprofen 200mg Tab', category: 'Drug', minLevel: 250, onHand: 480 },
  { id: 'itm-i', name: 'Metformin 500mg Tab', category: 'Drug', minLevel: 300, onHand: 310 },
  { id: 'itm-j', name: 'Vitamin C 100mg Chewable', category: 'Drug', minLevel: 120, onHand: 800 },
  { id: 'itm-k', name: 'Zinc Sulfate 20mg', category: 'Drug', minLevel: 100, onHand: 95 },
  { id: 'itm-l', name: 'Mask Surgical 3-Ply', category: 'Non-drug', minLevel: 500, onHand: 1200 },
];

// Use a fixed base date to keep SSR and client hydration deterministic
const BASE_DATE_ISO = process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T00:00:00Z';
const today = new Date(BASE_DATE_ISO);
const addDays = (d: number) => {
  const t = new Date(today);
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

const batches: Batch[] = [
  { id: 'b1', itemId: 'itm-a', quantity: 600, expiry: addDays(240) },
  { id: 'b2', itemId: 'itm-a', quantity: 600, expiry: addDays(420) },
  { id: 'b3', itemId: 'itm-b', quantity: 90, expiry: addDays(45) }, // near expiry
  { id: 'b4', itemId: 'itm-c', quantity: 60, expiry: addDays(75) }, // near expiry
  { id: 'b5', itemId: 'itm-g', quantity: 45, expiry: addDays(20) }, // near expiry
  { id: 'b6', itemId: 'itm-k', quantity: 95, expiry: addDays(50) }, // near expiry
  { id: 'b7', itemId: 'itm-d', quantity: 520, expiry: addDays(900) },
  { id: 'b8', itemId: 'itm-l', quantity: 1200, expiry: addDays(1200) },
];

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const dbItems = getItems();
  const dbBatches = getBatches();
  const onHandByItem = new Map<string, number>();
  for (const b of dbBatches) onHandByItem.set(b.itemId, (onHandByItem.get(b.itemId) || 0) + b.quantity);
  const onHandSkus = [...onHandByItem.values()].filter(v => v > 0).length;
  const lowStockCount = dbItems.filter((it) => (onHandByItem.get(it.id) || 0) < it.minLevel).length;
  // Near expiry: batches expiring within 90 days
  const ninetyDays = new Date(today);
  ninetyDays.setDate(ninetyDays.getDate() + 90);
  const nearExpiryCount = dbBatches.filter((b) => new Date(b.expiry) <= ninetyDays).length;
  // Inbound today: mock value
  const inboundToday = 3;
  return { onHandSkus, lowStockCount, nearExpiryCount, inboundToday };
}

export async function fetchRecentMovements(): Promise<PurchaseOrder[]> {
  // Mock Purchase Order data - Latest 5 recent POs
  const mockPurchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-010',
      poNumber: 'PO0010',
      supplier: 'MediCare Solutions',
      date: '2025-09-25',
      total: 15750,
      status: 'Pending'
    },
    {
      id: 'po-009',
      poNumber: 'PO0009',
      supplier: 'BioPharm Supplies',
      date: '2025-09-24',
      total: 22300,
      status: 'Partially Received'
    },
    {
      id: 'po-008',
      poNumber: 'PO0008',
      supplier: 'Global Medical',
      date: '2025-09-23',
      total: 18900,
      status: 'Completed'
    },
    {
      id: 'po-007',
      poNumber: 'PO0007',
      supplier: 'Prime Health Corp',
      date: '2025-09-22',
      total: 12800,
      status: 'Pending'
    },
    {
      id: 'po-006',
      poNumber: 'PO0006',
      supplier: 'MediSupply Sdn Bhd',
      date: '2025-09-21',
      total: 32150,
      status: 'Partially Received'
    }
  ];
  
  return mockPurchaseOrders;
}

// Charts
import type { LineData, HistogramData } from 'lightweight-charts';

export async function fetchStockMovementSeries(): Promise<LineData[]> {
  // monthly movement totals mock; use first day of month YYYY-MM-01 for time
  return [
    { time: '2025-04-01', value: 320 },
    { time: '2025-05-01', value: 410 },
    { time: '2025-06-01', value: 380 },
    { time: '2025-07-01', value: 460 },
    { time: '2025-08-01', value: 520 },
    { time: '2025-09-01', value: 480 },
  ];
}

export async function fetchExpiryTimeline(): Promise<HistogramData[]> {
  // items expiring by month; use first day of month YYYY-MM-01
  return [
    { time: '2025-10-01', value: 8 },
    { time: '2025-11-01', value: 6 },
    { time: '2025-12-01', value: 11 },
    { time: '2026-01-01', value: 5 },
    { time: '2026-02-01', value: 3 },
    { time: '2026-03-01', value: 2 },
  ];
}

export async function fetchLowStockItems(): Promise<LowStockItem[]> {
  const dbItems = getItems();
  const dbBatches = getBatches();
  const onHandByItem = new Map<string, number>();
  for (const b of dbBatches) onHandByItem.set(b.itemId, (onHandByItem.get(b.itemId) || 0) + b.quantity);
  
  // Create deterministic low stock items with consistent data
  const lowStockItems: LowStockItem[] = [
    { id: 'itm-b', name: 'Amoxicillin 250mg Cap', sku: 'AMOX-250-CAP', onHand: 90, minLevel: 150, deficit: 60 },
    { id: 'itm-c', name: 'Normal Saline 500ml', sku: 'NS-500', onHand: 60, minLevel: 80, deficit: 20 },
    { id: 'itm-g', name: 'Hydrocortisone 100mg Inj', sku: 'HYDRO-100-INJ', onHand: 45, minLevel: 60, deficit: 15 },
    { id: 'itm-k', name: 'Zinc Sulfate 20mg', sku: 'ZINC-20', onHand: 95, minLevel: 100, deficit: 5 },
  ];
  
  return lowStockItems;
}

export async function fetchExpiringBatchesSoon(): Promise<ExpiringBatch[]> {
  const base = new Date(process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T00:00:00Z');
  
  // Create deterministic expiring batches with consistent data
  const expiringBatches: ExpiringBatch[] = [
    { id: 'b5', itemName: 'Hydrocortisone 100mg Inj', expiry: '2025-09-21', daysLeft: 20, quantity: 45 },
    { id: 'b3', itemName: 'Amoxicillin 250mg Cap', expiry: '2025-10-16', daysLeft: 45, quantity: 90 },
    { id: 'b4', itemName: 'Normal Saline 500ml', expiry: '2025-11-15', daysLeft: 75, quantity: 60 },
    { id: 'b6', itemName: 'Zinc Sulfate 20mg', expiry: '2025-10-21', daysLeft: 50, quantity: 95 },
  ];
  
  return expiringBatches;
}

export async function fetchFastMovingItems(): Promise<FastMovingItem[]> {
  // Create deterministic fast moving items with consistent data, pre-sorted by movement
  const fastMovingItems: FastMovingItem[] = [
    { id: 'itm-a', name: 'Paracetamol 500mg Tab', sku: 'PARA-500-TAB', category: 'Drug', totalMovement: 600, rank: 1 },
    { id: 'itm-j', name: 'Vitamin C 100mg Chewable', sku: 'VITC-100-CHEW', category: 'Drug', totalMovement: 550, rank: 2 },
    { id: 'itm-h', name: 'Ibuprofen 200mg Tab', sku: 'IBU-200-TAB', category: 'Drug', totalMovement: 380, rank: 3 },
    { id: 'itm-i', name: 'Metformin 500mg Tab', sku: 'MET-500-TAB', category: 'Drug', totalMovement: 320, rank: 4 },
    { id: 'itm-f', name: 'Omeprazole 20mg Cap', sku: 'OMEP-20-CAP', category: 'Drug', totalMovement: 280, rank: 5 },
    { id: 'itm-l', name: 'Mask Surgical 3-Ply', sku: 'MASK-3PLY', category: 'Non-drug', totalMovement: 450, rank: 1 },
    { id: 'itm-d', name: 'Alcohol Swab', sku: 'ALC-SWAB', category: 'Non-drug', totalMovement: 260, rank: 2 },
    { id: 'itm-e', name: 'Syringe 5ml', sku: 'SYR-5ML', category: 'Non-drug', totalMovement: 240, rank: 3 },
    { id: 'itm-m', name: 'Gauze Pad 4x4', sku: 'GAUZE-4X4', category: 'Non-drug', totalMovement: 220, rank: 4 },
    { id: 'itm-n', name: 'Bandage Elastic 2in', sku: 'BAND-2IN', category: 'Non-drug', totalMovement: 200, rank: 5 },
  ];
  
  return fastMovingItems;
}

export async function fetchSlowMovingItems(): Promise<FastMovingItem[]> {
  // Create deterministic slow moving items with consistent data, pre-sorted by movement
  const slowMovingItems: FastMovingItem[] = [
    { id: 'itm-g', name: 'Hydrocortisone 100mg Inj', sku: 'HYDRO-100-INJ', category: 'Drug', totalMovement: 15, rank: 1 },
    { id: 'itm-k', name: 'Zinc Sulfate 20mg', sku: 'ZINC-20', category: 'Drug', totalMovement: 25, rank: 2 },
    { id: 'itm-c', name: 'Normal Saline 500ml', sku: 'NS-500', category: 'Drug', totalMovement: 35, rank: 3 },
    { id: 'itm-b', name: 'Amoxicillin 250mg Cap', sku: 'AMOX-250-CAP', category: 'Drug', totalMovement: 45, rank: 4 },
    { id: 'itm-o', name: 'Gloves Nitrile Large', sku: 'GLOVE-NIT-L', category: 'Non-drug', totalMovement: 55, rank: 1 },
  ];
  
  return slowMovingItems;
}

// Operational alerts (mock)
type DepartmentRequest = { id: string; department: string; itemId: string; quantity: number; status: 'PENDING' | 'FULFILLED' };
type PurchaseOrder = { id: string; created: string; status: 'OPEN' | 'PARTIAL' | 'COMPLETED' };
type DeliveryOrder = { id: string; poId: string; expected: string; received?: string };
type Invoice = { id: string; doId: string; paid: boolean };

function addIsoDays(baseIso: string, days: number): string {
  const d = new Date(baseIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const BASE_ISO = BASE_DATE_ISO;

const departmentRequests: DepartmentRequest[] = [
  { id: 'req-1', department: 'Ward A', itemId: 'itm-a', quantity: 120, status: 'PENDING' },
  { id: 'req-2', department: 'ER', itemId: 'itm-c', quantity: 40, status: 'FULFILLED' },
  { id: 'req-3', department: 'OT', itemId: 'itm-d', quantity: 300, status: 'PENDING' },
];

const purchaseOrders: PurchaseOrder[] = [
  { id: 'po-1001', created: addIsoDays(BASE_ISO, -20), status: 'OPEN' }, // > 2 weeks
  { id: 'po-1002', created: addIsoDays(BASE_ISO, -10), status: 'PARTIAL' },
  { id: 'po-1003', created: addIsoDays(BASE_ISO, -30), status: 'COMPLETED' },
];

const deliveryOrders: DeliveryOrder[] = [
  { id: 'do-2001', poId: 'po-1001', expected: addIsoDays(BASE_ISO, -3) }, // overdue
  { id: 'do-2002', poId: 'po-1002', expected: addIsoDays(BASE_ISO, -1), received: addIsoDays(BASE_ISO, 0) },
  { id: 'do-2003', poId: 'po-1003', expected: addIsoDays(BASE_ISO, -15), received: addIsoDays(BASE_ISO, -14) },
];

const invoices: Invoice[] = [
  { id: 'inv-3001', doId: 'do-2002', paid: false }, // received but not paid
  { id: 'inv-3002', doId: 'do-2003', paid: true },
];

export type OpsAlerts = {
  pendingDepartmentRequests: number;
  overdueDeliveries: number;
  longOpenOrders: number;
  receivedNotPaid: number;
  pendingApproval: number;
};

export async function fetchOpsAlerts(): Promise<OpsAlerts> {
  const base = new Date(BASE_ISO);
  const fourteenDaysAgo = new Date(BASE_ISO);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const pendingDepartmentRequests = departmentRequests.filter(r => r.status === 'PENDING').length;
  const overdueDeliveries = deliveryOrders.filter(d => !d.received && new Date(d.expected) < base).length;
  const longOpenOrders = purchaseOrders.filter(po => po.status !== 'COMPLETED' && new Date(po.created) <= fourteenDaysAgo).length;
  const receivedNotPaid = invoices.filter(inv => !inv.paid).length;
  const pendingApproval = 3; // Mock value for POs awaiting approval

  return { pendingDepartmentRequests, overdueDeliveries, longOpenOrders, receivedNotPaid, pendingApproval };
}


