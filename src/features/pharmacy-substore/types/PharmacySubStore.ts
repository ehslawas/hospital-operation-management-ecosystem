export type StockStatus = 'adequate' | 'low' | 'critical' | 'out-of-stock' | 'overstocked';
export type PurchaseOrderStatus = 'draft' | 'pending-approval' | 'approved' | 'ordered' | 'partially-received' | 'completed' | 'cancelled';
export type RequisitionStatus = 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected';
export type GRNStatus = 'draft' | 'verified' | 'approved' | 'posted';
export type StockMovementType = 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'return' | 'expired' | 'damaged';

export interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  genericName: string;
  
  // Classification
  category: 'drug' | 'consumable' | 'equipment' | 'reagent';
  drugClass?: string;
  therapeuticClass?: string;
  
  // Stock details
  strength?: string;
  dosageForm?: string;
  packSize: number;
  unitOfMeasure: string;
  
  // Current stock
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  
  // Thresholds
  reorderLevel: number;
  minimumStock: number;
  maximumStock: number;
  economicOrderQuantity: number;
  
  // Stock status
  status: StockStatus;
  daysToStockout: number;
  
  // Supplier information
  preferredSupplier: string;
  alternateSuppliers: string[];
  
  // Pricing
  lastPurchasePrice: number;
  averagePrice: number;
  standardCost: number;
  
  // Location
  storageLocation: string;
  binLocation?: string;
  
  // Batch tracking
  batches: StockBatch[];
  oldestBatchExpiry?: Date;
  
  // Special flags
  isControlled: boolean;
  isHighValue: boolean;
  isColdChain: boolean;
  isNarcotic: boolean;
  
  // Usage statistics
  averageMonthlyConsumption: number;
  lastIssueDate?: Date;
  
  notes?: string;
}

export interface StockBatch {
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  receivedDate: Date;
  grnNumber: string;
  supplierBatchNumber: string;
  manufacturingDate?: Date;
  costPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: Date;
  
  // Supplier details
  supplierName: string;
  supplierCode: string;
  supplierContact: string;
  supplierAddress: string;
  
  // PO details
  status: PurchaseOrderStatus;
  priority: 'routine' | 'urgent' | 'emergency';
  
  // Financial
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  paymentTerms: string;
  
  // Items
  items: PurchaseOrderItem[];
  
  // Delivery
  expectedDeliveryDate: Date;
  deliveryAddress: string;
  
  // Approval workflow
  requestedBy: string;
  approvedBy?: string;
  approvedDate?: Date;
  
  // Receiving
  receivedItems: number;
  totalItems: number;
  partiallyReceived: boolean;
  
  // Reference
  quotationNumber?: string;
  contractNumber?: string;
  
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  genericName?: string;
  strength?: string;
  packSize: number;
  
  orderedQuantity: number;
  receivedQuantity: number;
  outstandingQuantity: number;
  
  unitPrice: number;
  totalPrice: number;
  
  specifications?: string;
  notes?: string;
}

export interface WardRequisition {
  id: string;
  requisitionNumber: string;
  requisitionDate: Date;
  
  // Ward details
  wardName: string;
  wardCode: string;
  requestedBy: string;
  contactNumber: string;
  
  // Requisition details
  status: RequisitionStatus;
  priority: 'routine' | 'urgent' | 'stat';
  
  // Items
  items: RequisitionItem[];
  
  // Processing
  processedBy?: string;
  processedDate?: Date;
  approvedBy?: string;
  approvedDate?: Date;
  
  // Delivery
  issuedBy?: string;
  issuedDate?: Date;
  receivedBy?: string;
  receivedDate?: Date;
  
  // Rejection
  rejectionReason?: string;
  
  notes?: string;
}

export interface RequisitionItem {
  id: string;
  itemCode: string;
  itemName: string;
  strength?: string;
  
  requestedQuantity: number;
  approvedQuantity: number;
  issuedQuantity: number;
  
  unitOfMeasure: string;
  
  // Stock availability
  currentStock: number;
  available: boolean;
  
  substitutionItem?: string;
  substitutionReason?: string;
  
  notes?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  grnDate: Date;
  
  // Reference
  poNumber: string;
  poId: string;
  
  // Supplier
  supplierName: string;
  deliveryNoteNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  
  // Receiving details
  receivedBy: string;
  receivedDate: Date;
  
  status: GRNStatus;
  
  // Items
  items: GRNItem[];
  
  // Quality check
  qualityCheckedBy?: string;
  qualityCheckDate?: Date;
  qualityStatus?: 'passed' | 'failed' | 'partial';
  
  // Verification
  verifiedBy?: string;
  verifiedDate?: Date;
  
  // Financial
  totalAmount: number;
  
  // Discrepancies
  hasDiscrepancy: boolean;
  discrepancyNotes?: string;
  
  notes?: string;
}

export interface GRNItem {
  id: string;
  itemCode: string;
  itemName: string;
  
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  
  // Batch details
  batchNumber: string;
  supplierBatchNumber?: string;
  expiryDate: Date;
  manufacturingDate?: Date;
  
  // Quality
  qualityStatus: 'passed' | 'failed' | 'pending';
  rejectionReason?: string;
  
  // Pricing
  unitPrice: number;
  totalPrice: number;
  
  // Storage
  storageLocation?: string;
  binLocation?: string;
  
  notes?: string;
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  movementDate: Date;
  movementType: StockMovementType;
  
  itemCode: string;
  itemName: string;
  
  quantity: number;
  unitOfMeasure: string;
  
  // Batch details
  batchNumber?: string;
  expiryDate?: Date;
  
  // Source/Destination
  fromLocation: string;
  toLocation?: string;
  
  // Reference
  referenceNumber: string;
  referenceType: string;
  
  // Stock levels
  stockBefore: number;
  stockAfter: number;
  
  // User
  performedBy: string;
  
  remarks?: string;
}

export interface PharmacySubStoreStats {
  // Inventory
  totalStockItems: number;
  totalStockValue: number;
  lowStockItems: number;
  criticalStockItems: number;
  outOfStockItems: number;
  
  // Expiry management
  expiredItems: number;
  nearExpiryItems: number; // within 3 months
  expiryValueAtRisk: number;
  
  // Purchase orders
  pendingPOs: number;
  awaitingDelivery: number;
  totalPOValuePending: number;
  
  // Requisitions
  pendingRequisitions: number;
  todaysRequisitions: number;
  averageProcessingTime: number; // minutes
  
  // Activity today
  receiptsToday: number;
  issuesToday: number;
  requisitionsProcessed: number;
  
  // Financial
  monthlyPurchaseValue: number;
  monthlyIssueValue: number;
  
  // Efficiency
  stockTurnoverRatio: number;
  fillRate: number; // percentage
  
  // Cold chain
  coldChainItems: number;
  coldChainStockValue: number;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  
  contactPerson: string;
  contactNumber: string;
  email: string;
  
  address: string;
  city: string;
  state: string;
  postcode: string;
  
  // Business details
  registrationNumber: string;
  gstNumber?: string;
  
  // Categories
  supplierCategories: string[];
  
  // Terms
  paymentTerms: string;
  creditDays: number;
  
  // Performance
  rating: number; // 1-5
  reliabilityScore: number;
  qualityScore: number;
  
  // Status
  isActive: boolean;
  isPreferred: boolean;
  
  // Statistics
  totalPOsThisYear: number;
  totalValueThisYear: number;
  averageDeliveryDays: number;
  
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  adjustmentDate: Date;
  
  adjustmentType: 'physical-count' | 'damage' | 'expiry' | 'loss' | 'correction';
  
  itemCode: string;
  itemName: string;
  
  systemQuantity: number;
  physicalQuantity: number;
  adjustmentQuantity: number;
  
  batchNumber?: string;
  
  reason: string;
  
  approvedBy: string;
  performedBy: string;
  
  financialImpact: number;
  
  notes?: string;
}







