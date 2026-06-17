import { BaseEntity } from './base'

export type SupplierStatus = 'active' | 'inactive' | 'blacklisted'

export interface Supplier extends BaseEntity {
  supplier_code: string
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  registration_number?: string
  status: SupplierStatus
  hospital_id: string
}

export type ProductStatus = 'active' | 'discontinued' | 'pending'

export interface ProductCategory extends BaseEntity {
  category_code: string
  category_name: string
  parent_category_id?: string
  description?: string
  hospital_id: string
}

export interface Product extends BaseEntity {
  product_code: string
  product_name: string
  generic_name?: string
  category_id: string
  unit_of_measure: string
  unit_price?: number
  reorder_level?: number
  max_stock_level?: number
  is_controlled: boolean
  requires_prescription: boolean
  storage_requirements?: string
  hospital_id: string
  status: ProductStatus
}

export interface ProductWithRelations extends Product {
  category?: ProductCategory;
}

export type StorageLocationType = 'warehouse' | 'pharmacy' | 'ward' | 'cold_room'

export interface StorageLocation extends BaseEntity {
  location_code: string
  location_name: string
  location_type: StorageLocationType
  department_id?: string
  hospital_id: string
  parent_location_id?: string
  is_active: boolean
}

export interface Inventory extends BaseEntity {
  product_id: string
  hospital_id: string
  location_id: string
  batch_number?: string
  expiry_date?: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  last_stock_take?: string
}

export interface InventoryWithRelations extends Inventory {
  product?: Product;
  location?: StorageLocation;
}

export type TransactionType = 'receipt' | 'issue' | 'transfer' | 'adjust' | 'return' | 'dispose' | 'stock_take'

export interface InventoryTransaction extends BaseEntity {
  product_id: string
  hospital_id: string
  transaction_type: TransactionType
  reference_type?: string
  reference_id?: string
  from_location_id?: string
  to_location_id?: string
  quantity: number
  batch_number?: string
  unit_cost?: number
  reason?: string
  performed_by: string
}
