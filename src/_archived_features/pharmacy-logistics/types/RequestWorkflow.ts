export type RequestStatus = 
  | 'PENDING_REVIEW'     // Department sent request, waiting for pharmacy review
  | 'UNDER_REVIEW'       // Pharmacy is reviewing and modifying quantities
  | 'PENDING_APPROVAL'   // Waiting for head logistics approval
  | 'APPROVED'           // Approved and ready for issuing
  | 'ISSUED'             // Items have been issued
  | 'REJECTED'           // Request was rejected
  | 'CANCELLED';         // Request was cancelled

export type Department = 
  | 'ETU' 
  | 'GW' 
  | 'OT' 
  | 'HDU' 
  | 'ICU' 
  | 'WARD_A' 
  | 'WARD_B' 
  | 'WARD_C' 
  | 'EMERGENCY' 
  | 'PHARMACY';

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface DepartmentRequest {
  id: string;
  requestNumber: string;
  department: Department;
  requestedBy: string;
  requestedAt: string;
  priority: RequestPriority;
  status: RequestStatus;
  items: RequestItem[];
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestItem {
  id: string;
  itemId: string;
  itemName: string;
  drugCode: string;
  dosageForm: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  issuedQuantity?: number;
  unit: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  notes?: string;
  batchPreference?: string; // FEFO, FIFO, or specific batch
}

export interface ApprovalRequest {
  id: string;
  requestId: string;
  reviewedBy: string;
  reviewedAt: string;
  modifications: RequestItemModification[];
  reviewNotes?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface RequestItemModification {
  itemId: string;
  originalQuantity: number;
  modifiedQuantity: number;
  reason: string;
}

export interface IssueRequest {
  id: string;
  requestId: string;
  issuedBy: string;
  issuedAt: string;
  items: IssuedItem[];
  location: string;
  notes?: string;
}

export interface IssuedItem {
  itemId: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  scanned: boolean;
}

export interface VarianceReport {
  id: string;
  requestId: string;
  itemId: string;
  itemName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  issuedQuantity: number;
  variance: number;
  variancePercentage: number;
  reason?: string;
  createdAt: string;
}

export interface RequestFilters {
  status?: RequestStatus[];
  department?: Department[];
  priority?: RequestPriority[];
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface RequestStats {
  totalRequests: number;
  pendingReview: number;
  underReview: number;
  pendingApproval: number;
  approved: number;
  issued: number;
  rejected: number;
  averageProcessingTime: number; // in hours
}

