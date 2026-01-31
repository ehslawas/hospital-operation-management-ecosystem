export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    category: 'Drug' | 'Non-drug';
    batchNo: string;
    expiry: string;
    location: string;
    onHand: number;
    minLevel: number;
    maxLevel: number;
    unitCost: number;
    totalValue: number;
    consumption: number;
    status: 'active' | 'discontinued';
}

export interface ExpiringItem extends InventoryItem {
    itemName: string; // Alias for name to match dashboard usage
    daysLeft: number;
}

export interface OpsAlerts {
    pendingDepartmentRequests: number;
    longOpenOrders: number;
    pendingDeliveries: number;
    pendingPayments: number;
    pendingApproval: number;
    pendingApprovals: number; // Handling distinct usages in dashboard
    pendingPenalties: number;
}

const mockInventoryItems: InventoryItem[] = [
    {
        id: '1',
        name: 'Paracetamol 500mg',
        sku: 'DRUG-001',
        category: 'Drug',
        batchNo: 'BAT-001',
        expiry: '2024-12-31',
        location: 'A-01-01',
        onHand: 1000,
        minLevel: 500,
        maxLevel: 2000,
        unitCost: 0.5,
        totalValue: 500,
        consumption: 100,
        status: 'active',
    },
    {
        id: '2',
        name: 'Amoxicillin 250mg',
        sku: 'DRUG-002',
        category: 'Drug',
        batchNo: 'BAT-002',
        expiry: '2024-06-30',
        location: 'A-01-02',
        onHand: 200,
        minLevel: 300,
        maxLevel: 1000,
        unitCost: 1.2,
        totalValue: 240,
        consumption: 50,
        status: 'active',
    },
    {
        id: '3',
        name: 'Surgical Mask',
        sku: 'NON-001',
        category: 'Non-drug',
        batchNo: 'BAT-003',
        expiry: '2025-01-01',
        location: 'B-01-01',
        onHand: 5000,
        minLevel: 1000,
        maxLevel: 10000,
        unitCost: 0.1,
        totalValue: 500,
        consumption: 200,
        status: 'active',
    },
    {
        id: '4',
        name: 'Syringe 5ml',
        sku: 'NON-002',
        category: 'Non-drug',
        batchNo: 'BAT-004',
        expiry: '2025-06-01',
        location: 'B-01-02',
        onHand: 200,
        minLevel: 500,
        maxLevel: 2000,
        unitCost: 0.2,
        totalValue: 40,
        consumption: 50,
        status: 'active',
    }
];

export const fetchFastMovingItems = async (): Promise<InventoryItem[]> => {
    return mockInventoryItems;
};

export const fetchSlowMovingItems = async (): Promise<InventoryItem[]> => {
    return mockInventoryItems;
};

export const fetchLowStockItems = async (): Promise<InventoryItem[]> => {
    return mockInventoryItems.filter(item => item.onHand < item.minLevel);
};

export const fetchExpiringBatchesSoon = async (): Promise<ExpiringItem[]> => {
    return mockInventoryItems.map(item => ({
        ...item,
        itemName: item.name,
        daysLeft: Math.floor((new Date(item.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    })).filter(item => item.daysLeft < 90);
};

export const fetchOpsAlerts = async (): Promise<OpsAlerts> => {
    return {
        pendingDepartmentRequests: 5,
        longOpenOrders: 2,
        pendingDeliveries: 3,
        pendingPayments: 1,
        pendingApproval: 4,
        pendingApprovals: 4,
        pendingPenalties: 0,
    };
};
