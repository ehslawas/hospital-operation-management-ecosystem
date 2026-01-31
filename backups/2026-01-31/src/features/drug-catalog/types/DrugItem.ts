export type DrugItem = {
  id: string;
  drugCode: string;
  drugName: string;
  dosageForm: string;
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

export type DrugCatalogFilters = {
  search: string;
  category: string;
  supplier: string;
  budgetSource: string;
  status: string;
  dosageForm: string;
};

export type DrugCatalogStats = {
  totalItems: number;
  activeItems: number;
  inactiveItems: number;
  discontinuedItems: number;
  categories: string[];
  suppliers: string[];
  budgetSources: string[];
};
