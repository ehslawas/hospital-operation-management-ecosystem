export type Supplier = {
  id: string;
  companyName: string;
  address: string;
  email: string;
  phone: string;
  category: 'Pharmaceutical' | 'Medical Equipment' | 'Healthcare Services' | 'Laboratory' | 'Surgical' | 'General';
  status: 'Active' | 'Inactive' | 'Pending';
  rating: number;
  lastContact: string;
  totalOrders: number;
  totalValue: number;
  specialties: string[];
  website?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupplierFilters = {
  search: string;
  category: string;
  status: string;
  rating: string;
};

export type SupplierStats = {
  totalSuppliers: number;
  activeSuppliers: number;
  pendingSuppliers: number;
  averageRating: number;
  totalValue: number;
};
