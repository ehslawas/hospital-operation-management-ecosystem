export type NonDrugItem = {
  id: string;
  itemCode: string;
  itemName: string;
  specification: string;
  sku: string;
  category: string;
  supplier: string;
  budgetSource: string;
  unitPrice?: number;
  stockLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  expiryDate?: string;
  batchNumber?: string;
  status: 'Active' | 'Inactive' | 'Discontinued';
  createdAt: string;
  updatedAt: string;
};

export type NonDrugCatalogFilters = {
  search: string;
  category: string;
  supplier: string;
  budgetSource: string;
  status: string;
  specification: string;
};

export type NonDrugCatalogStats = {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  discontinuedItems: number;
  categories: string[];
  suppliers: string[];
  budgetSources: string[];
};
