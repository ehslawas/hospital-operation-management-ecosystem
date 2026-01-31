// Simple in-memory store for local MVP without a backend
import { 
  DepartmentRequest, 
  ApprovalRequest, 
  IssueRequest, 
  VarianceReport, 
  RequestStatus, 
  Department, 
  RequestPriority,
  RequestItem,
  IssuedItem,
  RequestStats
} from '../types/RequestWorkflow';

export type Item = { 
  id: string; 
  name: string; 
  drugCode: string;
  brandName: string;
  dosageForm: string;
  sku: string; 
  category: 'Drug' | 'Non-drug'; 
  minLevel: number;
  budgetSource: string;
};
export type Batch = { 
  id: string; 
  itemId: string; 
  batchNo: string;
  quantity: number; 
  expiry: string;
  brandName: string;
  sku: string;
};
export type Location = { id: string; name: string };
export type MovementType = 'RECEIVE' | 'ISSUE' | 'ADJUST' | 'TRANSFER';
export type Movement = { id: string; time: string; type: MovementType; item: string; quantity: number; location: string };

// Purchasing domain (simplified)
export type POStatus = 'OPEN' | 'PARTIAL' | 'COMPLETED';
export type POItem = { itemId: string; quantity: number; received: number };
export type PurchaseOrder = { id: string; supplier: string; created: string; expected?: string; status: POStatus; items: POItem[] };

export type DOStatus = 'PENDING' | 'RECEIVED';
export type DeliveryOrder = { id: string; poId: string; created: string; expected?: string; status: DOStatus; lines: { itemId: string; quantity: number; expiry: string }[] };

export type Invoice = { id: string; doId: string; amount: number; paid: boolean };

// Legacy request type for backward compatibility
export type LegacyDepartmentRequest = { id: string; department: string; itemId: string; quantity: number; status: 'PENDING' | 'FULFILLED' };
export type BadStockIncident = { id: string; itemId: string; quantity: number; reason: 'DAMAGED' | 'EXPIRED' | 'QUARANTINED'; when: string };
export type LOU = { id: string; ref: string; supplier: string; validFrom: string; validTo: string };

type Store = {
  items: Item[];
  batches: Batch[];
  locations: Location[];
  movements: Movement[];
  purchaseOrders: PurchaseOrder[];
  deliveryOrders: DeliveryOrder[];
  invoices: Invoice[];
  requests: LegacyDepartmentRequest[]; // Legacy requests
  departmentRequests: DepartmentRequest[]; // New workflow requests
  approvalRequests: ApprovalRequest[];
  issueRequests: IssueRequest[];
  varianceReports: VarianceReport[];
  badStock: BadStockIncident[];
  lous: LOU[];
};

const store: Store = {
  items: [
    // Cardiovascular Drugs
    { id: 'drug-001', name: 'Amlodipine 10mg', drugCode: 'AML-10', brandName: 'Norvasc', dosageForm: 'Tablet', sku: 'AML-10-TAB', category: 'Drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'drug-002', name: 'Amlodipine 5mg', drugCode: 'AML-5', brandName: 'Amlodipine Generic', dosageForm: 'Tablet', sku: 'AML-5-TAB', category: 'Drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'drug-003', name: 'Lisinopril 10mg', drugCode: 'LIS-10', brandName: 'Zestril', dosageForm: 'Tablet', sku: 'LIS-10-TAB', category: 'Drug', minLevel: 180, budgetSource: 'Ministry Budget' },
    { id: 'drug-004', name: 'Metoprolol 50mg', drugCode: 'MET-50', brandName: 'Lopressor', dosageForm: 'Tablet', sku: 'MET-50-TAB', category: 'Drug', minLevel: 120, budgetSource: 'Ministry Budget' },
    { id: 'drug-005', name: 'Atorvastatin 20mg', drugCode: 'ATO-20', brandName: 'Lipitor', dosageForm: 'Tablet', sku: 'ATO-20-TAB', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'drug-006', name: 'Simvastatin 40mg', drugCode: 'SIM-40', brandName: 'Zocor', dosageForm: 'Tablet', sku: 'SIM-40-TAB', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-007', name: 'Atenolol 50mg', drugCode: 'ATE-50', brandName: 'Tenormin', dosageForm: 'Tablet', sku: 'ATE-50-TAB', category: 'Drug', minLevel: 90, budgetSource: 'Ministry Budget' },
    { id: 'drug-008', name: 'Losartan 50mg', drugCode: 'LOS-50', brandName: 'Cozaar', dosageForm: 'Tablet', sku: 'LOS-50-TAB', category: 'Drug', minLevel: 110, budgetSource: 'Ministry Budget' },
    { id: 'drug-009', name: 'Valsartan 80mg', drugCode: 'VAL-80', brandName: 'Diovan', dosageForm: 'Tablet', sku: 'VAL-80-TAB', category: 'Drug', minLevel: 95, budgetSource: 'Ministry Budget' },
    { id: 'drug-010', name: 'Furosemide 40mg', drugCode: 'FUR-40', brandName: 'Lasix', dosageForm: 'Tablet', sku: 'FUR-40-TAB', category: 'Drug', minLevel: 130, budgetSource: 'Ministry Budget' },

    // Antibiotics
    { id: 'drug-011', name: 'Amoxicillin 250mg', drugCode: 'AMX-250', brandName: 'Amoxil', dosageForm: 'Capsule', sku: 'AMX-250-CAP', category: 'Drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'drug-012', name: 'Amoxicillin 500mg', drugCode: 'AMX-500', brandName: 'Amoxil', dosageForm: 'Capsule', sku: 'AMX-500-CAP', category: 'Drug', minLevel: 120, budgetSource: 'Ministry Budget' },
    { id: 'drug-013', name: 'Ciprofloxacin 500mg', drugCode: 'CIP-500', brandName: 'Cipro', dosageForm: 'Tablet', sku: 'CIP-500-TAB', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-014', name: 'Azithromycin 250mg', drugCode: 'AZI-250', brandName: 'Zithromax', dosageForm: 'Tablet', sku: 'AZI-250-TAB', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-015', name: 'Cephalexin 250mg', drugCode: 'CEF-250', brandName: 'Keflex', dosageForm: 'Capsule', sku: 'CEF-250-CAP', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'drug-016', name: 'Doxycycline 100mg', drugCode: 'DOX-100', brandName: 'Vibramycin', dosageForm: 'Capsule', sku: 'DOX-100-CAP', category: 'Drug', minLevel: 70, budgetSource: 'Ministry Budget' },
    { id: 'drug-017', name: 'Clindamycin 300mg', drugCode: 'CLI-300', brandName: 'Cleocin', dosageForm: 'Capsule', sku: 'CLI-300-CAP', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'drug-018', name: 'Metronidazole 400mg', drugCode: 'MET-400', brandName: 'Flagyl', dosageForm: 'Tablet', sku: 'MET-400-TAB', category: 'Drug', minLevel: 90, budgetSource: 'Ministry Budget' },
    { id: 'drug-019', name: 'Trimethoprim-Sulfamethoxazole', drugCode: 'TMP-SMX', brandName: 'Bactrim', dosageForm: 'Tablet', sku: 'TMP-SMX-TAB', category: 'Drug', minLevel: 110, budgetSource: 'Ministry Budget' },
    { id: 'drug-020', name: 'Vancomycin 500mg', drugCode: 'VAN-500', brandName: 'Vancocin', dosageForm: 'Injection', sku: 'VAN-500-INJ', category: 'Drug', minLevel: 30, budgetSource: 'Ministry Budget' },

    // Pain Management
    { id: 'drug-021', name: 'Paracetamol 500mg', drugCode: 'PAR-500', brandName: 'Panadol', dosageForm: 'Tablet', sku: 'PAR-500-TAB', category: 'Drug', minLevel: 300, budgetSource: 'Ministry Budget' },
    { id: 'drug-022', name: 'Ibuprofen 400mg', drugCode: 'IBU-400', brandName: 'Brufen', dosageForm: 'Tablet', sku: 'IBU-400-TAB', category: 'Drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'drug-023', name: 'Diclofenac 50mg', drugCode: 'DIC-50', brandName: 'Voltaren', dosageForm: 'Tablet', sku: 'DIC-50-TAB', category: 'Drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'drug-024', name: 'Tramadol 50mg', drugCode: 'TRA-50', brandName: 'Ultram', dosageForm: 'Capsule', sku: 'TRA-50-CAP', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-025', name: 'Morphine 10mg', drugCode: 'MOR-10', brandName: 'Morphine Sulfate', dosageForm: 'Injection', sku: 'MOR-10-INJ', category: 'Drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'drug-026', name: 'Codeine 30mg', drugCode: 'COD-30', brandName: 'Codeine Phosphate', dosageForm: 'Tablet', sku: 'COD-30-TAB', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-027', name: 'Naproxen 250mg', drugCode: 'NAP-250', brandName: 'Naprosyn', dosageForm: 'Tablet', sku: 'NAP-250-TAB', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'drug-028', name: 'Celecoxib 200mg', drugCode: 'CEL-200', brandName: 'Celebrex', dosageForm: 'Capsule', sku: 'CEL-200-CAP', category: 'Drug', minLevel: 70, budgetSource: 'Ministry Budget' },
    { id: 'drug-029', name: 'Ketorolac 10mg', drugCode: 'KET-10', brandName: 'Toradol', dosageForm: 'Injection', sku: 'KET-10-INJ', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'drug-030', name: 'Pregabalin 75mg', drugCode: 'PRE-75', brandName: 'Lyrica', dosageForm: 'Capsule', sku: 'PRE-75-CAP', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },

    // Diabetes Management
    { id: 'drug-031', name: 'Metformin 500mg', drugCode: 'MET-500', brandName: 'Glucophage', dosageForm: 'Tablet', sku: 'MET-500-TAB', category: 'Drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'drug-032', name: 'Metformin 850mg', drugCode: 'MET-850', brandName: 'Glucophage', dosageForm: 'Tablet', sku: 'MET-850-TAB', category: 'Drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'drug-033', name: 'Glibenclamide 5mg', drugCode: 'GLI-5', brandName: 'Daonil', dosageForm: 'Tablet', sku: 'GLI-5-TAB', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'drug-034', name: 'Gliclazide 80mg', drugCode: 'GLI-80', brandName: 'Diamicron', dosageForm: 'Tablet', sku: 'GLI-80-TAB', category: 'Drug', minLevel: 120, budgetSource: 'Ministry Budget' },
    { id: 'drug-035', name: 'Insulin Regular', drugCode: 'INS-REG', brandName: 'Humulin R', dosageForm: 'Injection', sku: 'INS-REG-INJ', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'drug-036', name: 'Insulin NPH', drugCode: 'INS-NPH', brandName: 'Humulin N', dosageForm: 'Injection', sku: 'INS-NPH-INJ', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'drug-037', name: 'Pioglitazone 30mg', drugCode: 'PIO-30', brandName: 'Actos', dosageForm: 'Tablet', sku: 'PIO-30-TAB', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-038', name: 'Sitagliptin 100mg', drugCode: 'SIT-100', brandName: 'Januvia', dosageForm: 'Tablet', sku: 'SIT-100-TAB', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-039', name: 'Acarbose 50mg', drugCode: 'ACA-50', brandName: 'Precose', dosageForm: 'Tablet', sku: 'ACA-50-TAB', category: 'Drug', minLevel: 70, budgetSource: 'Ministry Budget' },
    { id: 'drug-040', name: 'Repaglinide 1mg', drugCode: 'REP-1', brandName: 'Prandin', dosageForm: 'Tablet', sku: 'REP-1-TAB', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },

    // Gastrointestinal
    { id: 'drug-041', name: 'Omeprazole 20mg', drugCode: 'OME-20', brandName: 'Losec', dosageForm: 'Capsule', sku: 'OME-20-CAP', category: 'Drug', minLevel: 180, budgetSource: 'Ministry Budget' },
    { id: 'drug-042', name: 'Omeprazole 40mg', drugCode: 'OME-40', brandName: 'Losec', dosageForm: 'Capsule', sku: 'OME-40-CAP', category: 'Drug', minLevel: 120, budgetSource: 'Ministry Budget' },
    { id: 'drug-043', name: 'Ranitidine 150mg', drugCode: 'RAN-150', brandName: 'Zantac', dosageForm: 'Tablet', sku: 'RAN-150-TAB', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'drug-044', name: 'Famotidine 40mg', drugCode: 'FAM-40', brandName: 'Pepcid', dosageForm: 'Tablet', sku: 'FAM-40-TAB', category: 'Drug', minLevel: 90, budgetSource: 'Ministry Budget' },
    { id: 'drug-045', name: 'Lansoprazole 30mg', drugCode: 'LAN-30', brandName: 'Prevacid', dosageForm: 'Capsule', sku: 'LAN-30-CAP', category: 'Drug', minLevel: 110, budgetSource: 'Ministry Budget' },
    { id: 'drug-046', name: 'Pantoprazole 40mg', drugCode: 'PAN-40', brandName: 'Protonix', dosageForm: 'Tablet', sku: 'PAN-40-TAB', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-047', name: 'Domperidone 10mg', drugCode: 'DOM-10', brandName: 'Motilium', dosageForm: 'Tablet', sku: 'DOM-10-TAB', category: 'Drug', minLevel: 130, budgetSource: 'Ministry Budget' },
    { id: 'drug-048', name: 'Metoclopramide 10mg', drugCode: 'MET-10', brandName: 'Reglan', dosageForm: 'Tablet', sku: 'MET-10-TAB', category: 'Drug', minLevel: 70, budgetSource: 'Ministry Budget' },
    { id: 'drug-049', name: 'Ondansetron 4mg', drugCode: 'OND-4', brandName: 'Zofran', dosageForm: 'Tablet', sku: 'OND-4-TAB', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-050', name: 'Loperamide 2mg', drugCode: 'LOP-2', brandName: 'Imodium', dosageForm: 'Capsule', sku: 'LOP-2-CAP', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },

    // Respiratory
    { id: 'drug-051', name: 'Salbutamol 100mcg', drugCode: 'SAL-100', brandName: 'Ventolin', dosageForm: 'Inhaler', sku: 'SAL-100-INH', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-052', name: 'Budesonide 200mcg', drugCode: 'BUD-200', brandName: 'Pulmicort', dosageForm: 'Inhaler', sku: 'BUD-200-INH', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-053', name: 'Theophylline 200mg', drugCode: 'THE-200', brandName: 'Theo-Dur', dosageForm: 'Tablet', sku: 'THE-200-TAB', category: 'Drug', minLevel: 70, budgetSource: 'Ministry Budget' },
    { id: 'drug-054', name: 'Prednisolone 5mg', drugCode: 'PRE-5', brandName: 'Deltacortil', dosageForm: 'Tablet', sku: 'PRE-5-TAB', category: 'Drug', minLevel: 90, budgetSource: 'Ministry Budget' },
    { id: 'drug-055', name: 'Montelukast 10mg', drugCode: 'MON-10', brandName: 'Singulair', dosageForm: 'Tablet', sku: 'MON-10-TAB', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'drug-056', name: 'Ipratropium 20mcg', drugCode: 'IPR-20', brandName: 'Atrovent', dosageForm: 'Inhaler', sku: 'IPR-20-INH', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'drug-057', name: 'Fluticasone 250mcg', drugCode: 'FLU-250', brandName: 'Flixotide', dosageForm: 'Inhaler', sku: 'FLU-250-INH', category: 'Drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    { id: 'drug-058', name: 'Aminophylline 100mg', drugCode: 'AMI-100', brandName: 'Aminophylline', dosageForm: 'Injection', sku: 'AMI-100-INJ', category: 'Drug', minLevel: 25, budgetSource: 'Ministry Budget' },
    { id: 'drug-059', name: 'Hydrocortisone 100mg', drugCode: 'HYD-100', brandName: 'Solu-Cortef', dosageForm: 'Injection', sku: 'HYD-100-INJ', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'drug-060', name: 'Dexamethasone 4mg', drugCode: 'DEX-4', brandName: 'Decadron', dosageForm: 'Injection', sku: 'DEX-4-INJ', category: 'Drug', minLevel: 35, budgetSource: 'Ministry Budget' },

    // Central Nervous System
    { id: 'drug-061', name: 'Diazepam 5mg', drugCode: 'DIA-5', brandName: 'Valium', dosageForm: 'Tablet', sku: 'DIA-5-TAB', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-062', name: 'Lorazepam 1mg', drugCode: 'LOR-1', brandName: 'Ativan', dosageForm: 'Tablet', sku: 'LOR-1-TAB', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'drug-063', name: 'Fluoxetine 20mg', drugCode: 'FLU-20', brandName: 'Prozac', dosageForm: 'Capsule', sku: 'FLU-20-CAP', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-064', name: 'Sertraline 50mg', drugCode: 'SER-50', brandName: 'Zoloft', dosageForm: 'Tablet', sku: 'SER-50-TAB', category: 'Drug', minLevel: 70, budgetSource: 'Ministry Budget' },
    { id: 'drug-065', name: 'Amitriptyline 25mg', drugCode: 'AMI-25', brandName: 'Elavil', dosageForm: 'Tablet', sku: 'AMI-25-TAB', category: 'Drug', minLevel: 90, budgetSource: 'Ministry Budget' },
    { id: 'drug-066', name: 'Haloperidol 5mg', drugCode: 'HAL-5', brandName: 'Haldol', dosageForm: 'Tablet', sku: 'HAL-5-TAB', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'drug-067', name: 'Risperidone 2mg', drugCode: 'RIS-2', brandName: 'Risperdal', dosageForm: 'Tablet', sku: 'RIS-2-TAB', category: 'Drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    { id: 'drug-068', name: 'Olanzapine 10mg', drugCode: 'OLA-10', brandName: 'Zyprexa', dosageForm: 'Tablet', sku: 'OLA-10-TAB', category: 'Drug', minLevel: 25, budgetSource: 'Ministry Budget' },
    { id: 'drug-069', name: 'Carbamazepine 200mg', drugCode: 'CAR-200', brandName: 'Tegretol', dosageForm: 'Tablet', sku: 'CAR-200-TAB', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-070', name: 'Phenytoin 100mg', drugCode: 'PHE-100', brandName: 'Dilantin', dosageForm: 'Capsule', sku: 'PHE-100-CAP', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },

    // Endocrine
    { id: 'drug-071', name: 'Levothyroxine 50mcg', drugCode: 'LEV-50', brandName: 'Synthroid', dosageForm: 'Tablet', sku: 'LEV-50-TAB', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'drug-072', name: 'Levothyroxine 100mcg', drugCode: 'LEV-100', brandName: 'Synthroid', dosageForm: 'Tablet', sku: 'LEV-100-TAB', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-073', name: 'Methimazole 5mg', drugCode: 'MET-5', brandName: 'Tapazole', dosageForm: 'Tablet', sku: 'MET-5-TAB', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-074', name: 'Propylthiouracil 50mg', drugCode: 'PRO-50', brandName: 'PTU', dosageForm: 'Tablet', sku: 'PRO-50-TAB', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'drug-075', name: 'Hydrocortisone 20mg', drugCode: 'HYD-20', brandName: 'Cortef', dosageForm: 'Tablet', sku: 'HYD-20-TAB', category: 'Drug', minLevel: 70, budgetSource: 'Ministry Budget' },
    { id: 'drug-076', name: 'Prednisone 5mg', drugCode: 'PRE-5', brandName: 'Deltasone', dosageForm: 'Tablet', sku: 'PRE-5-TAB', category: 'Drug', minLevel: 90, budgetSource: 'Ministry Budget' },
    { id: 'drug-077', name: 'Dexamethasone 0.5mg', drugCode: 'DEX-0.5', brandName: 'Decadron', dosageForm: 'Tablet', sku: 'DEX-0.5-TAB', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'drug-078', name: 'Fludrocortisone 0.1mg', drugCode: 'FLU-0.1', brandName: 'Florinef', dosageForm: 'Tablet', sku: 'FLU-0.1-TAB', category: 'Drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    { id: 'drug-079', name: 'Testosterone 250mg', drugCode: 'TES-250', brandName: 'Testoviron', dosageForm: 'Injection', sku: 'TES-250-INJ', category: 'Drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'drug-080', name: 'Estradiol 2mg', drugCode: 'EST-2', brandName: 'Estrace', dosageForm: 'Tablet', sku: 'EST-2-TAB', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },

    // Hematology/Oncology
    { id: 'drug-081', name: 'Warfarin 5mg', drugCode: 'WAR-5', brandName: 'Coumadin', dosageForm: 'Tablet', sku: 'WAR-5-TAB', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'drug-082', name: 'Heparin 5000IU', drugCode: 'HEP-5000', brandName: 'Heparin Sodium', dosageForm: 'Injection', sku: 'HEP-5000-INJ', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'drug-083', name: 'Aspirin 100mg', drugCode: 'ASP-100', brandName: 'Cardiospirin', dosageForm: 'Tablet', sku: 'ASP-100-TAB', category: 'Drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'drug-084', name: 'Clopidogrel 75mg', drugCode: 'CLO-75', brandName: 'Plavix', dosageForm: 'Tablet', sku: 'CLO-75-TAB', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-085', name: 'Iron Sulfate 200mg', drugCode: 'IRN-200', brandName: 'Ferrous Sulfate', dosageForm: 'Tablet', sku: 'IRN-200-TAB', category: 'Drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'drug-086', name: 'Folic Acid 5mg', drugCode: 'FOL-5', brandName: 'Folic Acid', dosageForm: 'Tablet', sku: 'FOL-5-TAB', category: 'Drug', minLevel: 120, budgetSource: 'Ministry Budget' },
    { id: 'drug-087', name: 'Cyanocobalamin 1000mcg', drugCode: 'CYA-1000', brandName: 'Vitamin B12', dosageForm: 'Injection', sku: 'CYA-1000-INJ', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-088', name: 'Erythropoietin 4000IU', drugCode: 'ERY-4000', brandName: 'Eprex', dosageForm: 'Injection', sku: 'ERY-4000-INJ', category: 'Drug', minLevel: 25, budgetSource: 'Ministry Budget' },
    { id: 'drug-089', name: 'Methotrexate 2.5mg', drugCode: 'MET-2.5', brandName: 'Methotrexate', dosageForm: 'Tablet', sku: 'MET-2.5-TAB', category: 'Drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    { id: 'drug-090', name: 'Cyclophosphamide 50mg', drugCode: 'CYC-50', brandName: 'Cytoxan', dosageForm: 'Tablet', sku: 'CYC-50-TAB', category: 'Drug', minLevel: 20, budgetSource: 'Ministry Budget' },

    // Urogenital
    { id: 'drug-091', name: 'Furosemide 40mg', drugCode: 'FUR-40', brandName: 'Lasix', dosageForm: 'Tablet', sku: 'FUR-40-TAB', category: 'Drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'drug-092', name: 'Hydrochlorothiazide 25mg', drugCode: 'HYD-25', brandName: 'Hydrodiuril', dosageForm: 'Tablet', sku: 'HYD-25-TAB', category: 'Drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'drug-093', name: 'Spironolactone 25mg', drugCode: 'SPI-25', brandName: 'Aldactone', dosageForm: 'Tablet', sku: 'SPI-25-TAB', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-094', name: 'Finasteride 5mg', drugCode: 'FIN-5', brandName: 'Proscar', dosageForm: 'Tablet', sku: 'FIN-5-TAB', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'drug-095', name: 'Tamsulosin 0.4mg', drugCode: 'TAM-0.4', brandName: 'Flomax', dosageForm: 'Capsule', sku: 'TAM-0.4-CAP', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'drug-096', name: 'Sildenafil 50mg', drugCode: 'SIL-50', brandName: 'Viagra', dosageForm: 'Tablet', sku: 'SIL-50-TAB', category: 'Drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    { id: 'drug-097', name: 'Ciprofloxacin 500mg', drugCode: 'CIP-500', brandName: 'Cipro', dosageForm: 'Tablet', sku: 'CIP-500-TAB', category: 'Drug', minLevel: 70, budgetSource: 'Ministry Budget' },
    { id: 'drug-098', name: 'Nitrofurantoin 100mg', drugCode: 'NIT-100', brandName: 'Macrodantin', dosageForm: 'Capsule', sku: 'NIT-100-CAP', category: 'Drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'drug-099', name: 'Phenazopyridine 200mg', drugCode: 'PHE-200', brandName: 'Pyridium', dosageForm: 'Tablet', sku: 'PHE-200-TAB', category: 'Drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'drug-100', name: 'Oxybutynin 5mg', drugCode: 'OXY-5', brandName: 'Ditropan', dosageForm: 'Tablet', sku: 'OXY-5-TAB', category: 'Drug', minLevel: 50, budgetSource: 'Ministry Budget' },

    // Non-drug items - Medical Supplies & Equipment (100 items)
    // Personal Protective Equipment
    { id: 'non-drug-001', name: 'Alcohol Swab', drugCode: 'N/A', brandName: 'Generic', dosageForm: 'Swab', sku: 'ALC-SWAB', category: 'Non-drug', minLevel: 300, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-002', name: 'Syringe 5ml', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Syringe', sku: 'SYR-5ML', category: 'Non-drug', minLevel: 400, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-003', name: 'Mask Surgical 3-Ply', drugCode: 'N/A', brandName: '3M', dosageForm: 'Mask', sku: 'MASK-3PLY', category: 'Non-drug', minLevel: 500, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-004', name: 'Gauze Pad 4x4', drugCode: 'N/A', brandName: 'Johnson & Johnson', dosageForm: 'Pad', sku: 'GAUZE-4X4', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-005', name: 'Bandage Elastic 2in', drugCode: 'N/A', brandName: 'Elastoplast', dosageForm: 'Bandage', sku: 'BAND-2IN', category: 'Non-drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-006', name: 'Gloves Nitrile Large', drugCode: 'N/A', brandName: 'Ansell', dosageForm: 'Gloves', sku: 'GLOVE-NIT-L', category: 'Non-drug', minLevel: 300, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-007', name: 'N95 Respirator Mask', drugCode: 'N/A', brandName: 'Honeywell', dosageForm: 'Mask', sku: 'N95-HW', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-008', name: 'Face Shield Clear', drugCode: 'N/A', brandName: '3M', dosageForm: 'Shield', sku: 'FS-CLR-3M', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-009', name: 'Gown Disposable L', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Gown', sku: 'GWN-DSP-L', category: 'Non-drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-010', name: 'Gloves Latex Medium', drugCode: 'N/A', brandName: 'Ansell', dosageForm: 'Gloves', sku: 'GLOVE-LAT-M', category: 'Non-drug', minLevel: 400, budgetSource: 'Ministry Budget' },
    
    // Syringes & Needles
    { id: 'non-drug-011', name: 'Syringe 1ml', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Syringe', sku: 'SYR-1ML', category: 'Non-drug', minLevel: 500, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-012', name: 'Syringe 3ml', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Syringe', sku: 'SYR-3ML', category: 'Non-drug', minLevel: 400, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-013', name: 'Syringe 10ml', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Syringe', sku: 'SYR-10ML', category: 'Non-drug', minLevel: 300, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-014', name: 'Needle 21G x 1.5in', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Needle', sku: 'NDL-21G-1.5', category: 'Non-drug', minLevel: 600, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-015', name: 'Needle 23G x 1in', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Needle', sku: 'NDL-23G-1', category: 'Non-drug', minLevel: 500, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-016', name: 'Needle 25G x 1in', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Needle', sku: 'NDL-25G-1', category: 'Non-drug', minLevel: 400, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-017', name: 'Butterfly Needle 21G', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Needle', sku: 'BF-21G', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-018', name: 'IV Cannula 18G', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Cannula', sku: 'IV-18G', category: 'Non-drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-019', name: 'IV Cannula 20G', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Cannula', sku: 'IV-20G', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-020', name: 'IV Cannula 22G', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Cannula', sku: 'IV-22G', category: 'Non-drug', minLevel: 180, budgetSource: 'Ministry Budget' },
    
    // Wound Care
    { id: 'non-drug-021', name: 'Gauze Roll 2in', drugCode: 'N/A', brandName: 'Johnson & Johnson', dosageForm: 'Roll', sku: 'GAUZE-R-2', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-022', name: 'Gauze Roll 4in', drugCode: 'N/A', brandName: 'Johnson & Johnson', dosageForm: 'Roll', sku: 'GAUZE-R-4', category: 'Non-drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-023', name: 'Cotton Wool 500g', drugCode: 'N/A', brandName: 'Johnson & Johnson', dosageForm: 'Cotton', sku: 'COTTON-500', category: 'Non-drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-024', name: 'Adhesive Tape 1in', drugCode: 'N/A', brandName: '3M', dosageForm: 'Tape', sku: 'TAPE-1IN', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-025', name: 'Adhesive Tape 2in', drugCode: 'N/A', brandName: '3M', dosageForm: 'Tape', sku: 'TAPE-2IN', category: 'Non-drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-026', name: 'Bandage Crepe 3in', drugCode: 'N/A', brandName: 'Elastoplast', dosageForm: 'Bandage', sku: 'BAND-CREPE-3', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-027', name: 'Bandage Crepe 4in', drugCode: 'N/A', brandName: 'Elastoplast', dosageForm: 'Bandage', sku: 'BAND-CREPE-4', category: 'Non-drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-028', name: 'Plaster Strip 1in', drugCode: 'N/A', brandName: 'Elastoplast', dosageForm: 'Plaster', sku: 'PLASTER-1IN', category: 'Non-drug', minLevel: 300, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-029', name: 'Plaster Strip 2in', drugCode: 'N/A', brandName: 'Elastoplast', dosageForm: 'Plaster', sku: 'PLASTER-2IN', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-030', name: 'Hydrocolloid Dressing', drugCode: 'N/A', brandName: 'ConvaTec', dosageForm: 'Dressing', sku: 'HYDRO-DRESS', category: 'Non-drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    
    // IV Supplies
    { id: 'non-drug-031', name: 'IV Set Standard', drugCode: 'N/A', brandName: 'Baxter', dosageForm: 'Set', sku: 'IV-SET-STD', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-032', name: 'IV Set Micro', drugCode: 'N/A', brandName: 'Baxter', dosageForm: 'Set', sku: 'IV-SET-MICRO', category: 'Non-drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-033', name: 'IV Bag 500ml', drugCode: 'N/A', brandName: 'Baxter', dosageForm: 'Bag', sku: 'IV-BAG-500', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-034', name: 'IV Bag 1000ml', drugCode: 'N/A', brandName: 'Baxter', dosageForm: 'Bag', sku: 'IV-BAG-1000', category: 'Non-drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-035', name: 'Extension Set 20cm', drugCode: 'N/A', brandName: 'Baxter', dosageForm: 'Set', sku: 'EXT-20CM', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-036', name: 'Extension Set 50cm', drugCode: 'N/A', brandName: 'Baxter', dosageForm: 'Set', sku: 'EXT-50CM', category: 'Non-drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-037', name: '3-Way Stopcock', drugCode: 'N/A', brandName: 'Baxter', dosageForm: 'Stopcock', sku: '3WAY-STOP', category: 'Non-drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-038', name: 'IV Pole Mobile', drugCode: 'N/A', brandName: 'Hill-Rom', dosageForm: 'Pole', sku: 'IV-POLE-MOB', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-039', name: 'IV Pump Infusion', drugCode: 'N/A', brandName: 'Baxter', dosageForm: 'Pump', sku: 'IV-PUMP', category: 'Non-drug', minLevel: 10, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-040', name: 'Blood Pressure Cuff Adult', drugCode: 'N/A', brandName: 'Welch Allyn', dosageForm: 'Cuff', sku: 'BP-CUFF-ADULT', category: 'Non-drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    
    // Diagnostic Equipment
    { id: 'non-drug-041', name: 'Thermometer Digital', drugCode: 'N/A', brandName: 'Omron', dosageForm: 'Thermometer', sku: 'TEMP-DIG', category: 'Non-drug', minLevel: 25, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-042', name: 'Stethoscope Adult', drugCode: 'N/A', brandName: 'Littmann', dosageForm: 'Stethoscope', sku: 'STETH-ADULT', category: 'Non-drug', minLevel: 15, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-043', name: 'Stethoscope Pediatric', drugCode: 'N/A', brandName: 'Littmann', dosageForm: 'Stethoscope', sku: 'STETH-PED', category: 'Non-drug', minLevel: 10, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-044', name: 'Pulse Oximeter', drugCode: 'N/A', brandName: 'Masimo', dosageForm: 'Oximeter', sku: 'PULSE-OX', category: 'Non-drug', minLevel: 8, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-045', name: 'Blood Glucose Meter', drugCode: 'N/A', brandName: 'Roche', dosageForm: 'Meter', sku: 'GLUCOSE-METER', category: 'Non-drug', minLevel: 5, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-046', name: 'Glucose Test Strips', drugCode: 'N/A', brandName: 'Roche', dosageForm: 'Strips', sku: 'GLUCOSE-STRIPS', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-047', name: 'Lancet 28G', drugCode: 'N/A', brandName: 'Roche', dosageForm: 'Lancet', sku: 'LANCET-28G', category: 'Non-drug', minLevel: 500, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-048', name: 'Urine Test Strip', drugCode: 'N/A', brandName: 'Siemens', dosageForm: 'Strip', sku: 'URINE-STRIP', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-049', name: 'Pregnancy Test Kit', drugCode: 'N/A', brandName: 'Clearblue', dosageForm: 'Kit', sku: 'PREGNANCY-TEST', category: 'Non-drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-050', name: 'Rapid COVID Test', drugCode: 'N/A', brandName: 'Abbott', dosageForm: 'Kit', sku: 'COVID-RAPID', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    
    // Surgical Instruments
    { id: 'non-drug-051', name: 'Scalpel Blade #10', drugCode: 'N/A', brandName: 'Swann-Morton', dosageForm: 'Blade', sku: 'SCALPEL-10', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-052', name: 'Scalpel Blade #11', drugCode: 'N/A', brandName: 'Swann-Morton', dosageForm: 'Blade', sku: 'SCALPEL-11', category: 'Non-drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-053', name: 'Scalpel Blade #15', drugCode: 'N/A', brandName: 'Swann-Morton', dosageForm: 'Blade', sku: 'SCALPEL-15', category: 'Non-drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-054', name: 'Suture 3-0 Silk', drugCode: 'N/A', brandName: 'Ethicon', dosageForm: 'Suture', sku: 'SUTURE-3-0-SILK', category: 'Non-drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-055', name: 'Suture 4-0 Nylon', drugCode: 'N/A', brandName: 'Ethicon', dosageForm: 'Suture', sku: 'SUTURE-4-0-NYLON', category: 'Non-drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-056', name: 'Suture 5-0 Vicryl', drugCode: 'N/A', brandName: 'Ethicon', dosageForm: 'Suture', sku: 'SUTURE-5-0-VICRYL', category: 'Non-drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-057', name: 'Needle Holder 5.5in', drugCode: 'N/A', brandName: 'Aesculap', dosageForm: 'Holder', sku: 'NEEDLE-HOLDER-5.5', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-058', name: 'Forceps Straight', drugCode: 'N/A', brandName: 'Aesculap', dosageForm: 'Forceps', sku: 'FORCEPS-STR', category: 'Non-drug', minLevel: 25, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-059', name: 'Forceps Curved', drugCode: 'N/A', brandName: 'Aesculap', dosageForm: 'Forceps', sku: 'FORCEPS-CURV', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-060', name: 'Scissors Mayo', drugCode: 'N/A', brandName: 'Aesculap', dosageForm: 'Scissors', sku: 'SCISSORS-MAYO', category: 'Non-drug', minLevel: 15, budgetSource: 'Ministry Budget' },
    
    // Respiratory Equipment
    { id: 'non-drug-061', name: 'Oxygen Mask Simple', drugCode: 'N/A', brandName: 'Hudson RCI', dosageForm: 'Mask', sku: 'O2-MASK-SIMPLE', category: 'Non-drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-062', name: 'Oxygen Mask Non-Rebreather', drugCode: 'N/A', brandName: 'Hudson RCI', dosageForm: 'Mask', sku: 'O2-MASK-NRB', category: 'Non-drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-063', name: 'Nebulizer Kit', drugCode: 'N/A', brandName: 'Omron', dosageForm: 'Kit', sku: 'NEBULIZER-KIT', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-064', name: 'Nebulizer Mask Adult', drugCode: 'N/A', brandName: 'Omron', dosageForm: 'Mask', sku: 'NEB-MASK-ADULT', category: 'Non-drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-065', name: 'Nebulizer Mask Pediatric', drugCode: 'N/A', brandName: 'Omron', dosageForm: 'Mask', sku: 'NEB-MASK-PED', category: 'Non-drug', minLevel: 30, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-066', name: 'Oxygen Tubing 7ft', drugCode: 'N/A', brandName: 'Hudson RCI', dosageForm: 'Tubing', sku: 'O2-TUBE-7FT', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-067', name: 'Oxygen Tubing 10ft', drugCode: 'N/A', brandName: 'Hudson RCI', dosageForm: 'Tubing', sku: 'O2-TUBE-10FT', category: 'Non-drug', minLevel: 80, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-068', name: 'Nasal Cannula Adult', drugCode: 'N/A', brandName: 'Hudson RCI', dosageForm: 'Cannula', sku: 'NASAL-CAN-ADULT', category: 'Non-drug', minLevel: 60, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-069', name: 'Nasal Cannula Pediatric', drugCode: 'N/A', brandName: 'Hudson RCI', dosageForm: 'Cannula', sku: 'NASAL-CAN-PED', category: 'Non-drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-070', name: 'Venturi Mask 24%', drugCode: 'N/A', brandName: 'Hudson RCI', dosageForm: 'Mask', sku: 'VENTURI-24', category: 'Non-drug', minLevel: 25, budgetSource: 'Ministry Budget' },
    
    // Laboratory Supplies
    { id: 'non-drug-071', name: 'Blood Collection Tube Red', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Tube', sku: 'BCT-RED', category: 'Non-drug', minLevel: 200, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-072', name: 'Blood Collection Tube Blue', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Tube', sku: 'BCT-BLUE', category: 'Non-drug', minLevel: 150, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-073', name: 'Blood Collection Tube Purple', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Tube', sku: 'BCT-PURPLE', category: 'Non-drug', minLevel: 180, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-074', name: 'Blood Collection Tube Green', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Tube', sku: 'BCT-GREEN', category: 'Non-drug', minLevel: 120, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-075', name: 'Blood Collection Tube Yellow', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Tube', sku: 'BCT-YELLOW', category: 'Non-drug', minLevel: 100, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-076', name: 'Tourniquet Latex', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Tourniquet', sku: 'TOURNIQUET-LATEX', category: 'Non-drug', minLevel: 50, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-077', name: 'Tourniquet Vinyl', drugCode: 'N/A', brandName: 'BD', dosageForm: 'Tourniquet', sku: 'TOURNIQUET-VINYL', category: 'Non-drug', minLevel: 40, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-078', name: 'Microscope Slide', drugCode: 'N/A', brandName: 'Thermo Fisher', dosageForm: 'Slide', sku: 'MICRO-SLIDE', category: 'Non-drug', minLevel: 500, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-079', name: 'Cover Slip 22x22mm', drugCode: 'N/A', brandName: 'Thermo Fisher', dosageForm: 'Cover', sku: 'COVER-22X22', category: 'Non-drug', minLevel: 1000, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-080', name: 'Pipette 1ml', drugCode: 'N/A', brandName: 'Eppendorf', dosageForm: 'Pipette', sku: 'PIPETTE-1ML', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    
    // Emergency Equipment
    { id: 'non-drug-081', name: 'AED Defibrillator', drugCode: 'N/A', brandName: 'Philips', dosageForm: 'AED', sku: 'AED-PHILIPS', category: 'Non-drug', minLevel: 2, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-082', name: 'AED Electrode Pad', drugCode: 'N/A', brandName: 'Philips', dosageForm: 'Pad', sku: 'AED-PAD', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-083', name: 'Ambu Bag Adult', drugCode: 'N/A', brandName: 'Laerdal', dosageForm: 'Bag', sku: 'AMBU-ADULT', category: 'Non-drug', minLevel: 10, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-084', name: 'Ambu Bag Pediatric', drugCode: 'N/A', brandName: 'Laerdal', dosageForm: 'Bag', sku: 'AMBU-PED', category: 'Non-drug', minLevel: 8, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-085', name: 'Laryngoscope Handle', drugCode: 'N/A', brandName: 'Welch Allyn', dosageForm: 'Handle', sku: 'LARYNGO-HANDLE', category: 'Non-drug', minLevel: 5, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-086', name: 'Laryngoscope Blade #3', drugCode: 'N/A', brandName: 'Welch Allyn', dosageForm: 'Blade', sku: 'LARYNGO-BLADE-3', category: 'Non-drug', minLevel: 10, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-087', name: 'Laryngoscope Blade #4', drugCode: 'N/A', brandName: 'Welch Allyn', dosageForm: 'Blade', sku: 'LARYNGO-BLADE-4', category: 'Non-drug', minLevel: 8, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-088', name: 'Endotracheal Tube 7.5', drugCode: 'N/A', brandName: 'Mallinckrodt', dosageForm: 'Tube', sku: 'ETT-7.5', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-089', name: 'Endotracheal Tube 8.0', drugCode: 'N/A', brandName: 'Mallinckrodt', dosageForm: 'Tube', sku: 'ETT-8.0', category: 'Non-drug', minLevel: 15, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-090', name: 'Stylet 6Fr', drugCode: 'N/A', brandName: 'Mallinckrodt', dosageForm: 'Stylet', sku: 'STYLET-6FR', category: 'Non-drug', minLevel: 25, budgetSource: 'Ministry Budget' },
    
    // Mobility & Support
    { id: 'non-drug-091', name: 'Wheelchair Standard', drugCode: 'N/A', brandName: 'Invacare', dosageForm: 'Chair', sku: 'WHEELCHAIR-STD', category: 'Non-drug', minLevel: 5, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-092', name: 'Crutches Adult', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Crutches', sku: 'CRUTCHES-ADULT', category: 'Non-drug', minLevel: 10, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-093', name: 'Walker Standard', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Walker', sku: 'WALKER-STD', category: 'Non-drug', minLevel: 8, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-094', name: 'Cane Adjustable', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Cane', sku: 'CANE-ADJ', category: 'Non-drug', minLevel: 15, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-095', name: 'Bedpan Standard', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Bedpan', sku: 'BEDPAN-STD', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-096', name: 'Urinal Male', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Urinal', sku: 'URINAL-MALE', category: 'Non-drug', minLevel: 25, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-097', name: 'Commode Chair', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Chair', sku: 'COMMODE-CHAIR', category: 'Non-drug', minLevel: 5, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-098', name: 'Transfer Board', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Board', sku: 'TRANSFER-BOARD', category: 'Non-drug', minLevel: 8, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-099', name: 'Gait Belt', drugCode: 'N/A', brandName: 'Medline', dosageForm: 'Belt', sku: 'GAIT-BELT', category: 'Non-drug', minLevel: 20, budgetSource: 'Ministry Budget' },
    { id: 'non-drug-100', name: 'Patient Lift Sling', drugCode: 'N/A', brandName: 'Invacare', dosageForm: 'Sling', sku: 'LIFT-SLING', category: 'Non-drug', minLevel: 10, budgetSource: 'Ministry Budget' },
  ],
  batches: [
    // Non-drug batches - Some items have stock, some don't (realistic scenario)
    
    // PPE Items with stock
    { id: 'batch-nd-001', itemId: 'non-drug-001', batchNo: 'ALC-2024-001', quantity: 150, expiry: '2025-12-31', brandName: 'Generic', sku: 'ALC-SWAB' },
    { id: 'batch-nd-002', itemId: 'non-drug-001', batchNo: 'ALC-2024-002', quantity: 200, expiry: '2026-03-15', brandName: 'Generic', sku: 'ALC-SWAB' },
    
    { id: 'batch-nd-003', itemId: 'non-drug-002', batchNo: 'SYR-2024-001', quantity: 300, expiry: '2027-06-30', brandName: 'BD', sku: 'SYR-5ML' },
    { id: 'batch-nd-004', itemId: 'non-drug-002', batchNo: 'SYR-2024-002', quantity: 250, expiry: '2027-09-15', brandName: 'BD', sku: 'SYR-5ML' },
    
    { id: 'batch-nd-005', itemId: 'non-drug-003', batchNo: 'MASK-2024-001', quantity: 400, expiry: '2026-12-31', brandName: '3M', sku: 'MASK-3PLY' },
    { id: 'batch-nd-006', itemId: 'non-drug-003', batchNo: 'MASK-2024-002', quantity: 350, expiry: '2027-02-28', brandName: '3M', sku: 'MASK-3PLY' },
    
    { id: 'batch-nd-007', itemId: 'non-drug-004', batchNo: 'GAUZE-2024-001', quantity: 120, expiry: '2026-08-31', brandName: 'Johnson & Johnson', sku: 'GAUZE-4X4' },
    { id: 'batch-nd-008', itemId: 'non-drug-004', batchNo: 'GAUZE-2024-002', quantity: 180, expiry: '2026-11-15', brandName: 'Johnson & Johnson', sku: 'GAUZE-4X4' },
    
    { id: 'batch-nd-009', itemId: 'non-drug-005', batchNo: 'BAND-2024-001', quantity: 100, expiry: '2027-01-31', brandName: 'Elastoplast', sku: 'BAND-2IN' },
    
    { id: 'batch-nd-010', itemId: 'non-drug-006', batchNo: 'GLOVE-2024-001', quantity: 200, expiry: '2026-10-31', brandName: 'Ansell', sku: 'GLOVE-NIT-L' },
    { id: 'batch-nd-011', itemId: 'non-drug-006', batchNo: 'GLOVE-2024-002', quantity: 150, expiry: '2027-01-15', brandName: 'Ansell', sku: 'GLOVE-NIT-L' },
    
    // Syringes & Needles with stock
    { id: 'batch-nd-012', itemId: 'non-drug-011', batchNo: 'SYR1-2024-001', quantity: 400, expiry: '2027-03-31', brandName: 'BD', sku: 'SYR-1ML' },
    { id: 'batch-nd-013', itemId: 'non-drug-011', batchNo: 'SYR1-2024-002', quantity: 300, expiry: '2027-06-15', brandName: 'BD', sku: 'SYR-1ML' },
    
    { id: 'batch-nd-014', itemId: 'non-drug-012', batchNo: 'SYR3-2024-001', quantity: 350, expiry: '2027-04-30', brandName: 'BD', sku: 'SYR-3ML' },
    
    { id: 'batch-nd-015', itemId: 'non-drug-013', batchNo: 'SYR10-2024-001', quantity: 200, expiry: '2027-05-31', brandName: 'BD', sku: 'SYR-10ML' },
    
    { id: 'batch-nd-016', itemId: 'non-drug-014', batchNo: 'NDL21-2024-001', quantity: 500, expiry: '2027-07-31', brandName: 'BD', sku: 'NDL-21G-1.5' },
    { id: 'batch-nd-017', itemId: 'non-drug-014', batchNo: 'NDL21-2024-002', quantity: 400, expiry: '2027-10-15', brandName: 'BD', sku: 'NDL-21G-1.5' },
    
    { id: 'batch-nd-018', itemId: 'non-drug-015', batchNo: 'NDL23-2024-001', quantity: 450, expiry: '2027-08-31', brandName: 'BD', sku: 'NDL-23G-1' },
    
    { id: 'batch-nd-019', itemId: 'non-drug-016', batchNo: 'NDL25-2024-001', quantity: 350, expiry: '2027-09-30', brandName: 'BD', sku: 'NDL-25G-1' },
    
    { id: 'batch-nd-020', itemId: 'non-drug-017', batchNo: 'BF21-2024-001', quantity: 150, expiry: '2026-12-31', brandName: 'BD', sku: 'BF-21G' },
    
    // IV Supplies with stock
    { id: 'batch-nd-021', itemId: 'non-drug-018', batchNo: 'IV18-2024-001', quantity: 100, expiry: '2027-11-30', brandName: 'BD', sku: 'IV-18G' },
    { id: 'batch-nd-022', itemId: 'non-drug-018', batchNo: 'IV18-2024-002', quantity: 80, expiry: '2028-01-15', brandName: 'BD', sku: 'IV-18G' },
    
    { id: 'batch-nd-023', itemId: 'non-drug-019', batchNo: 'IV20-2024-001', quantity: 120, expiry: '2027-12-31', brandName: 'BD', sku: 'IV-20G' },
    
    { id: 'batch-nd-024', itemId: 'non-drug-020', batchNo: 'IV22-2024-001', quantity: 100, expiry: '2028-02-28', brandName: 'BD', sku: 'IV-22G' },
    
    // Wound Care with stock
    { id: 'batch-nd-025', itemId: 'non-drug-021', batchNo: 'GR2-2024-001', quantity: 60, expiry: '2026-09-30', brandName: 'Johnson & Johnson', sku: 'GAUZE-R-2' },
    
    { id: 'batch-nd-026', itemId: 'non-drug-022', batchNo: 'GR4-2024-001', quantity: 50, expiry: '2026-10-31', brandName: 'Johnson & Johnson', sku: 'GAUZE-R-4' },
    
    { id: 'batch-nd-027', itemId: 'non-drug-023', batchNo: 'COT-2024-001', quantity: 30, expiry: '2027-01-31', brandName: 'Johnson & Johnson', sku: 'COTTON-500' },
    
    { id: 'batch-nd-028', itemId: 'non-drug-024', batchNo: 'TAPE1-2024-001', quantity: 150, expiry: '2027-03-31', brandName: '3M', sku: 'TAPE-1IN' },
    
    { id: 'batch-nd-029', itemId: 'non-drug-025', batchNo: 'TAPE2-2024-001', quantity: 100, expiry: '2027-04-30', brandName: '3M', sku: 'TAPE-2IN' },
    
    { id: 'batch-nd-030', itemId: 'non-drug-026', batchNo: 'BC3-2024-001', quantity: 70, expiry: '2027-05-31', brandName: 'Elastoplast', sku: 'BAND-CREPE-3' },
    
    { id: 'batch-nd-031', itemId: 'non-drug-027', batchNo: 'BC4-2024-001', quantity: 60, expiry: '2027-06-30', brandName: 'Elastoplast', sku: 'BAND-CREPE-4' },
    
    { id: 'batch-nd-032', itemId: 'non-drug-028', batchNo: 'PL1-2024-001', quantity: 200, expiry: '2027-07-31', brandName: 'Elastoplast', sku: 'PLASTER-1IN' },
    
    { id: 'batch-nd-033', itemId: 'non-drug-029', batchNo: 'PL2-2024-001', quantity: 150, expiry: '2027-08-31', brandName: 'Elastoplast', sku: 'PLASTER-2IN' },
    
    // IV Supplies with stock
    { id: 'batch-nd-034', itemId: 'non-drug-031', batchNo: 'IVS-2024-001', quantity: 80, expiry: '2027-09-30', brandName: 'Baxter', sku: 'IV-SET-STD' },
    
    { id: 'batch-nd-035', itemId: 'non-drug-032', batchNo: 'IVM-2024-001', quantity: 60, expiry: '2027-10-31', brandName: 'Baxter', sku: 'IV-SET-MICRO' },
    
    { id: 'batch-nd-036', itemId: 'non-drug-033', batchNo: 'IVB500-2024-001', quantity: 150, expiry: '2027-11-30', brandName: 'Baxter', sku: 'IV-BAG-500' },
    
    { id: 'batch-nd-037', itemId: 'non-drug-034', batchNo: 'IVB1000-2024-001', quantity: 100, expiry: '2027-12-31', brandName: 'Baxter', sku: 'IV-BAG-1000' },
    
    // Diagnostic Equipment with stock
    { id: 'batch-nd-038', itemId: 'non-drug-041', batchNo: 'TEMP-2024-001', quantity: 20, expiry: '2028-01-31', brandName: 'Omron', sku: 'TEMP-DIG' },
    
    { id: 'batch-nd-039', itemId: 'non-drug-042', batchNo: 'STETH-2024-001', quantity: 12, expiry: '2028-02-28', brandName: 'Littmann', sku: 'STETH-ADULT' },
    
    { id: 'batch-nd-040', itemId: 'non-drug-043', batchNo: 'STETHP-2024-001', quantity: 8, expiry: '2028-03-31', brandName: 'Littmann', sku: 'STETH-PED' },
    
    { id: 'batch-nd-041', itemId: 'non-drug-044', batchNo: 'POX-2024-001', quantity: 6, expiry: '2028-04-30', brandName: 'Masimo', sku: 'PULSE-OX' },
    
    { id: 'batch-nd-042', itemId: 'non-drug-045', batchNo: 'GLUC-2024-001', quantity: 4, expiry: '2028-05-31', brandName: 'Roche', sku: 'GLUCOSE-METER' },
    
    { id: 'batch-nd-043', itemId: 'non-drug-046', batchNo: 'GSTR-2024-001', quantity: 150, expiry: '2027-06-30', brandName: 'Roche', sku: 'GLUCOSE-STRIPS' },
    { id: 'batch-nd-044', itemId: 'non-drug-046', batchNo: 'GSTR-2024-002', quantity: 200, expiry: '2027-09-15', brandName: 'Roche', sku: 'GLUCOSE-STRIPS' },
    
    { id: 'batch-nd-045', itemId: 'non-drug-047', batchNo: 'LANC-2024-001', quantity: 400, expiry: '2027-07-31', brandName: 'Roche', sku: 'LANCET-28G' },
    
    { id: 'batch-nd-046', itemId: 'non-drug-048', batchNo: 'URINE-2024-001', quantity: 80, expiry: '2027-08-31', brandName: 'Siemens', sku: 'URINE-STRIP' },
    
    { id: 'batch-nd-047', itemId: 'non-drug-049', batchNo: 'PREGN-2024-001', quantity: 40, expiry: '2027-09-30', brandName: 'Clearblue', sku: 'PREGNANCY-TEST' },
    
    { id: 'batch-nd-048', itemId: 'non-drug-050', batchNo: 'COVID-2024-001', quantity: 80, expiry: '2027-10-31', brandName: 'Abbott', sku: 'COVID-RAPID' },
    
    // Surgical Instruments with stock
    { id: 'batch-nd-049', itemId: 'non-drug-051', batchNo: 'SC10-2024-001', quantity: 80, expiry: '2027-11-30', brandName: 'Swann-Morton', sku: 'SCALPEL-10' },
    { id: 'batch-nd-050', itemId: 'non-drug-052', batchNo: 'SC11-2024-001', quantity: 60, expiry: '2027-12-31', brandName: 'Swann-Morton', sku: 'SCALPEL-11' },
    { id: 'batch-nd-051', itemId: 'non-drug-053', batchNo: 'SC15-2024-001', quantity: 45, expiry: '2028-01-31', brandName: 'Swann-Morton', sku: 'SCALPEL-15' },
    { id: 'batch-nd-052', itemId: 'non-drug-054', batchNo: 'SUT3-2024-001', quantity: 40, expiry: '2028-02-28', brandName: 'Ethicon', sku: 'SUTURE-3-0-SILK' },
    { id: 'batch-nd-053', itemId: 'non-drug-055', batchNo: 'SUT4-2024-001', quantity: 30, expiry: '2028-03-31', brandName: 'Ethicon', sku: 'SUTURE-4-0-NYLON' },
    { id: 'batch-nd-054', itemId: 'non-drug-056', batchNo: 'SUT5-2024-001', quantity: 25, expiry: '2028-04-30', brandName: 'Ethicon', sku: 'SUTURE-5-0-VICRYL' },
    
    // Respiratory Equipment with stock
    { id: 'batch-nd-055', itemId: 'non-drug-061', batchNo: 'O2S-2024-001', quantity: 40, expiry: '2028-05-31', brandName: 'Hudson RCI', sku: 'O2-MASK-SIMPLE' },
    { id: 'batch-nd-056', itemId: 'non-drug-062', batchNo: 'O2NRB-2024-001', quantity: 25, expiry: '2028-06-30', brandName: 'Hudson RCI', sku: 'O2-MASK-NRB' },
    { id: 'batch-nd-057', itemId: 'non-drug-063', batchNo: 'NEB-2024-001', quantity: 15, expiry: '2028-07-31', brandName: 'Omron', sku: 'NEBULIZER-KIT' },
    { id: 'batch-nd-058', itemId: 'non-drug-064', batchNo: 'NEBM-2024-001', quantity: 30, expiry: '2028-08-31', brandName: 'Omron', sku: 'NEB-MASK-ADULT' },
    { id: 'batch-nd-059', itemId: 'non-drug-065', batchNo: 'NEBP-2024-001', quantity: 25, expiry: '2028-09-30', brandName: 'Omron', sku: 'NEB-MASK-PED' },
    { id: 'batch-nd-060', itemId: 'non-drug-066', batchNo: 'O2T7-2024-001', quantity: 80, expiry: '2028-10-31', brandName: 'Hudson RCI', sku: 'O2-TUBE-7FT' },
    { id: 'batch-nd-061', itemId: 'non-drug-067', batchNo: 'O2T10-2024-001', quantity: 60, expiry: '2028-11-30', brandName: 'Hudson RCI', sku: 'O2-TUBE-10FT' },
    { id: 'batch-nd-062', itemId: 'non-drug-068', batchNo: 'NCAD-2024-001', quantity: 45, expiry: '2028-12-31', brandName: 'Hudson RCI', sku: 'NASAL-CAN-ADULT' },
    { id: 'batch-nd-063', itemId: 'non-drug-069', batchNo: 'NCP-2024-001', quantity: 30, expiry: '2029-01-31', brandName: 'Hudson RCI', sku: 'NASAL-CAN-PED' },
    { id: 'batch-nd-064', itemId: 'non-drug-070', batchNo: 'VENT24-2024-001', quantity: 20, expiry: '2029-02-28', brandName: 'Hudson RCI', sku: 'VENTURI-24' },
    
    // Laboratory Supplies with stock
    { id: 'batch-nd-065', itemId: 'non-drug-071', batchNo: 'BCTR-2024-001', quantity: 150, expiry: '2027-12-31', brandName: 'BD', sku: 'BCT-RED' },
    { id: 'batch-nd-066', itemId: 'non-drug-072', batchNo: 'BCTB-2024-001', quantity: 120, expiry: '2028-01-31', brandName: 'BD', sku: 'BCT-BLUE' },
    { id: 'batch-nd-067', itemId: 'non-drug-073', batchNo: 'BCTP-2024-001', quantity: 140, expiry: '2028-02-28', brandName: 'BD', sku: 'BCT-PURPLE' },
    { id: 'batch-nd-068', itemId: 'non-drug-074', batchNo: 'BCTG-2024-001', quantity: 100, expiry: '2028-03-31', brandName: 'BD', sku: 'BCT-GREEN' },
    { id: 'batch-nd-069', itemId: 'non-drug-075', batchNo: 'BCTY-2024-001', quantity: 80, expiry: '2028-04-30', brandName: 'BD', sku: 'BCT-YELLOW' },
    { id: 'batch-nd-070', itemId: 'non-drug-076', batchNo: 'TQ-L-2024-001', quantity: 40, expiry: '2028-05-31', brandName: 'BD', sku: 'TOURNIQUET-LATEX' },
    { id: 'batch-nd-071', itemId: 'non-drug-077', batchNo: 'TQ-V-2024-001', quantity: 30, expiry: '2028-06-30', brandName: 'BD', sku: 'TOURNIQUET-VINYL' },
    { id: 'batch-nd-072', itemId: 'non-drug-078', batchNo: 'MS-2024-001', quantity: 400, expiry: '2028-07-31', brandName: 'Thermo Fisher', sku: 'MICRO-SLIDE' },
    { id: 'batch-nd-073', itemId: 'non-drug-079', batchNo: 'CS-2024-001', quantity: 800, expiry: '2028-08-31', brandName: 'Thermo Fisher', sku: 'COVER-22X22' },
    { id: 'batch-nd-074', itemId: 'non-drug-080', batchNo: 'PIP1-2024-001', quantity: 15, expiry: '2028-09-30', brandName: 'Eppendorf', sku: 'PIPETTE-1ML' },
    
    // Emergency Equipment with stock
    { id: 'batch-nd-075', itemId: 'non-drug-081', batchNo: 'AED-2024-001', quantity: 2, expiry: '2029-01-31', brandName: 'Philips', sku: 'AED-PHILIPS' },
    { id: 'batch-nd-076', itemId: 'non-drug-082', batchNo: 'AEDP-2024-001', quantity: 15, expiry: '2028-10-31', brandName: 'Philips', sku: 'AED-PAD' },
    { id: 'batch-nd-077', itemId: 'non-drug-083', batchNo: 'AMBU-A-2024-001', quantity: 8, expiry: '2028-11-30', brandName: 'Laerdal', sku: 'AMBU-ADULT' },
    { id: 'batch-nd-078', itemId: 'non-drug-084', batchNo: 'AMBU-P-2024-001', quantity: 6, expiry: '2028-12-31', brandName: 'Laerdal', sku: 'AMBU-PED' },
    { id: 'batch-nd-079', itemId: 'non-drug-085', batchNo: 'LARH-2024-001', quantity: 4, expiry: '2029-01-31', brandName: 'Welch Allyn', sku: 'LARYNGO-HANDLE' },
    { id: 'batch-nd-080', itemId: 'non-drug-086', batchNo: 'LARB3-2024-001', quantity: 8, expiry: '2029-02-28', brandName: 'Welch Allyn', sku: 'LARYNGO-BLADE-3' },
    { id: 'batch-nd-081', itemId: 'non-drug-087', batchNo: 'LARB4-2024-001', quantity: 6, expiry: '2029-03-31', brandName: 'Welch Allyn', sku: 'LARYNGO-BLADE-4' },
    { id: 'batch-nd-082', itemId: 'non-drug-088', batchNo: 'ETT75-2024-001', quantity: 15, expiry: '2029-04-30', brandName: 'Mallinckrodt', sku: 'ETT-7.5' },
    { id: 'batch-nd-083', itemId: 'non-drug-089', batchNo: 'ETT80-2024-001', quantity: 12, expiry: '2029-05-31', brandName: 'Mallinckrodt', sku: 'ETT-8.0' },
    { id: 'batch-nd-084', itemId: 'non-drug-090', batchNo: 'STY6-2024-001', quantity: 20, expiry: '2029-06-30', brandName: 'Mallinckrodt', sku: 'STYLET-6FR' },
    
    // Mobility & Support with stock
    { id: 'batch-nd-085', itemId: 'non-drug-091', batchNo: 'WC-2024-001', quantity: 4, expiry: '2029-07-31', brandName: 'Invacare', sku: 'WHEELCHAIR-STD' },
    { id: 'batch-nd-086', itemId: 'non-drug-092', batchNo: 'CRUT-2024-001', quantity: 8, expiry: '2029-08-31', brandName: 'Medline', sku: 'CRUTCHES-ADULT' },
    { id: 'batch-nd-087', itemId: 'non-drug-093', batchNo: 'WALK-2024-001', quantity: 6, expiry: '2029-09-30', brandName: 'Medline', sku: 'WALKER-STD' },
    { id: 'batch-nd-088', itemId: 'non-drug-094', batchNo: 'CANE-2024-001', quantity: 12, expiry: '2029-10-31', brandName: 'Medline', sku: 'CANE-ADJ' },
    { id: 'batch-nd-089', itemId: 'non-drug-095', batchNo: 'BP-2024-001', quantity: 15, expiry: '2029-11-30', brandName: 'Medline', sku: 'BEDPAN-STD' },
    { id: 'batch-nd-090', itemId: 'non-drug-096', batchNo: 'UR-M-2024-001', quantity: 20, expiry: '2029-12-31', brandName: 'Medline', sku: 'URINAL-MALE' },
    { id: 'batch-nd-091', itemId: 'non-drug-097', batchNo: 'COMM-2024-001', quantity: 4, expiry: '2030-01-31', brandName: 'Medline', sku: 'COMMODE-CHAIR' },
    { id: 'batch-nd-092', itemId: 'non-drug-098', batchNo: 'TB-2024-001', quantity: 6, expiry: '2030-02-28', brandName: 'Medline', sku: 'TRANSFER-BOARD' },
    { id: 'batch-nd-093', itemId: 'non-drug-099', batchNo: 'GB-2024-001', quantity: 15, expiry: '2030-03-31', brandName: 'Medline', sku: 'GAIT-BELT' },
    { id: 'batch-nd-094', itemId: 'non-drug-100', batchNo: 'LS-2024-001', quantity: 8, expiry: '2030-04-30', brandName: 'Invacare', sku: 'LIFT-SLING' },
  ],
  locations: [
    { id: 'loc-main', name: 'Main Store' },
    { id: 'loc-sub1', name: 'Sub-store 1' },
    { id: 'loc-ward-a', name: 'Ward A' },
  ],
  movements: [],
  purchaseOrders: [],
  deliveryOrders: [],
  invoices: [],
  requests: [],
  departmentRequests: [],
  approvalRequests: [
    {
      id: 'appr-001',
      requestId: 'req-002',
      reviewedBy: 'Pharmacist John Smith',
      reviewedAt: '2024-12-15T11:00:00Z',
      modifications: [
        {
          itemId: 'drug-003',
          originalQuantity: 200,
          modifiedQuantity: 150,
          reason: 'Stock limitation - reduced quantity to available stock'
        }
      ],
      reviewNotes: 'Reduced Paracetamol quantity due to current stock levels',
      status: 'PENDING_APPROVAL'
    }
  ],
  issueRequests: [],
  varianceReports: [],
  badStock: [],
  lous: [],
};

// Seed batches and movements
(() => {
  const BASE_DATE_ISO = process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T00:00:00Z';
  const today = new Date(BASE_DATE_ISO);
  const addDays = (d: number) => { const t = new Date(today); t.setDate(t.getDate() + d); return t.toISOString().slice(0,10); };
  const pushBatch = (b: Batch) => store.batches.push(b);
  
  // Amlodipine 10mg - Multiple batches with different brands
  pushBatch({ id: 'b-aml-10-001', itemId: 'drug-001', batchNo: 'AML10-2401', quantity: 500, expiry: addDays(240), brandName: 'Norvasc', sku: 'AML-10-TAB-NORV' });
  pushBatch({ id: 'b-aml-10-002', itemId: 'drug-001', batchNo: 'AML10-2402', quantity: 300, expiry: addDays(420), brandName: 'Norvasc', sku: 'AML-10-TAB-NORV' });
  pushBatch({ id: 'b-aml-10-003', itemId: 'drug-001', batchNo: 'AML10-2403', quantity: 200, expiry: addDays(180), brandName: 'Amlodipine Generic', sku: 'AML-10-TAB-GEN' });
  
  // Amlodipine 5mg - Different brand batches
  pushBatch({ id: 'b-aml-5-001', itemId: 'drug-002', batchNo: 'AML5-2401', quantity: 400, expiry: addDays(300), brandName: 'Amlodipine Generic', sku: 'AML-5-TAB-GEN' });
  pushBatch({ id: 'b-aml-5-002', itemId: 'drug-002', batchNo: 'AML5-2402', quantity: 250, expiry: addDays(450), brandName: 'Amlodipine Generic', sku: 'AML-5-TAB-GEN' });
  
  // Lisinopril 10mg - Multiple brands
  pushBatch({ id: 'b-lis-10-001', itemId: 'drug-003', batchNo: 'LIS10-2401', quantity: 300, expiry: addDays(200), brandName: 'Zestril', sku: 'LIS-10-TAB-ZEST' });
  pushBatch({ id: 'b-lis-10-002', itemId: 'drug-003', batchNo: 'LIS10-2402', quantity: 200, expiry: addDays(350), brandName: 'Lisinopril Generic', sku: 'LIS-10-TAB-GEN' });
  
  // Metoprolol 50mg - Different expiry dates
  pushBatch({ id: 'b-met-50-001', itemId: 'drug-004', batchNo: 'MET50-2401', quantity: 150, expiry: addDays(90), brandName: 'Lopressor', sku: 'MET-50-TAB-LOP' });
  pushBatch({ id: 'b-met-50-002', itemId: 'drug-004', batchNo: 'MET50-2402', quantity: 100, expiry: addDays(180), brandName: 'Lopressor', sku: 'MET-50-TAB-LOP' });
  pushBatch({ id: 'b-met-50-003', itemId: 'drug-004', batchNo: 'MET50-2403', quantity: 200, expiry: addDays(300), brandName: 'Metoprolol Generic', sku: 'MET-50-TAB-GEN' });
  
  // Atorvastatin 20mg - Near expiry batch
  pushBatch({ id: 'b-ato-20-001', itemId: 'drug-005', batchNo: 'ATO20-2401', quantity: 80, expiry: addDays(30), brandName: 'Lipitor', sku: 'ATO-20-TAB-LIP' });
  pushBatch({ id: 'b-ato-20-002', itemId: 'drug-005', batchNo: 'ATO20-2402', quantity: 120, expiry: addDays(200), brandName: 'Lipitor', sku: 'ATO-20-TAB-LIP' });
  pushBatch({ id: 'b-ato-20-003', itemId: 'drug-005', batchNo: 'ATO20-2403', quantity: 150, expiry: addDays(400), brandName: 'Atorvastatin Generic', sku: 'ATO-20-TAB-GEN' });
  
  // Simvastatin 40mg - Low stock
  pushBatch({ id: 'b-sim-40-001', itemId: 'drug-006', batchNo: 'SIM40-2401', quantity: 60, expiry: addDays(120), brandName: 'Zocor', sku: 'SIM-40-TAB-ZOC' });
  pushBatch({ id: 'b-sim-40-002', itemId: 'drug-006', batchNo: 'SIM40-2402', quantity: 40, expiry: addDays(250), brandName: 'Simvastatin Generic', sku: 'SIM-40-TAB-GEN' });
  
  // Paracetamol 500mg - High volume
  pushBatch({ id: 'b-par-500-001', itemId: 'drug-021', batchNo: 'PAR500-2401', quantity: 500, expiry: addDays(300), brandName: 'Panadol', sku: 'PAR-500-TAB-PAN' });
  pushBatch({ id: 'b-par-500-002', itemId: 'drug-021', batchNo: 'PAR500-2402', quantity: 400, expiry: addDays(450), brandName: 'Paracetamol Generic', sku: 'PAR-500-TAB-GEN' });
  pushBatch({ id: 'b-par-500-003', itemId: 'drug-021', batchNo: 'PAR500-2403', quantity: 300, expiry: addDays(600), brandName: 'Tylenol', sku: 'PAR-500-TAB-TYL' });
  
  // Amoxicillin 250mg - Antibiotic batches
  pushBatch({ id: 'b-amx-250-001', itemId: 'drug-011', batchNo: 'AMX250-2401', quantity: 200, expiry: addDays(120), brandName: 'Amoxil', sku: 'AMX-250-CAP-AMX' });
  pushBatch({ id: 'b-amx-250-002', itemId: 'drug-011', batchNo: 'AMX250-2402', quantity: 150, expiry: addDays(250), brandName: 'Amoxicillin Generic', sku: 'AMX-250-CAP-GEN' });
  
  // Additional drug batches for comprehensive inventory
  // Metformin 500mg - Diabetes management
  pushBatch({ id: 'b-met-500-001', itemId: 'drug-031', batchNo: 'MET500-2401', quantity: 200, expiry: addDays(300), brandName: 'Glucophage', sku: 'MET-500-TAB-GLU' });
  pushBatch({ id: 'b-met-500-002', itemId: 'drug-031', batchNo: 'MET500-2402', quantity: 150, expiry: addDays(450), brandName: 'Metformin Generic', sku: 'MET-500-TAB-GEN' });
  
  // Insulin Regular - Critical drug
  pushBatch({ id: 'b-ins-reg-001', itemId: 'drug-035', batchNo: 'INSREG-2401', quantity: 30, expiry: addDays(60), brandName: 'Humulin R', sku: 'INS-REG-INJ-HUM' });
  pushBatch({ id: 'b-ins-reg-002', itemId: 'drug-035', batchNo: 'INSREG-2402', quantity: 25, expiry: addDays(120), brandName: 'Insulin Regular Generic', sku: 'INS-REG-INJ-GEN' });
  
  // Omeprazole 20mg - High volume
  pushBatch({ id: 'b-ome-20-001', itemId: 'drug-041', batchNo: 'OME20-2401', quantity: 150, expiry: addDays(200), brandName: 'Losec', sku: 'OME-20-CAP-LOS' });
  pushBatch({ id: 'b-ome-20-002', itemId: 'drug-041', batchNo: 'OME20-2402', quantity: 120, expiry: addDays(350), brandName: 'Omeprazole Generic', sku: 'OME-20-CAP-GEN' });
  pushBatch({ id: 'b-ome-20-003', itemId: 'drug-041', batchNo: 'OME20-2403', quantity: 100, expiry: addDays(500), brandName: 'Prilosec', sku: 'OME-20-CAP-PRI' });
  
  // Salbutamol 100mcg - Respiratory
  pushBatch({ id: 'b-sal-100-001', itemId: 'drug-051', batchNo: 'SAL100-2401', quantity: 60, expiry: addDays(180), brandName: 'Ventolin', sku: 'SAL-100-INH-VEN' });
  pushBatch({ id: 'b-sal-100-002', itemId: 'drug-051', batchNo: 'SAL100-2402', quantity: 50, expiry: addDays(300), brandName: 'Salbutamol Generic', sku: 'SAL-100-INH-GEN' });
  
  // Diazepam 5mg - Controlled substance
  pushBatch({ id: 'b-dia-5-001', itemId: 'drug-061', batchNo: 'DIA5-2401', quantity: 40, expiry: addDays(90), brandName: 'Valium', sku: 'DIA-5-TAB-VAL' });
  pushBatch({ id: 'b-dia-5-002', itemId: 'drug-061', batchNo: 'DIA5-2402', quantity: 35, expiry: addDays(180), brandName: 'Diazepam Generic', sku: 'DIA-5-TAB-GEN' });
  
  // Warfarin 5mg - Anticoagulant
  pushBatch({ id: 'b-war-5-001', itemId: 'drug-081', batchNo: 'WAR5-2401', quantity: 80, expiry: addDays(150), brandName: 'Coumadin', sku: 'WAR-5-TAB-COU' });
  pushBatch({ id: 'b-war-5-002', itemId: 'drug-081', batchNo: 'WAR5-2402', quantity: 70, expiry: addDays(300), brandName: 'Warfarin Generic', sku: 'WAR-5-TAB-GEN' });
  
  // Non-drug items
  pushBatch({ id: 'b-nd-001', itemId: 'non-drug-001', batchNo: 'ND001-2401', quantity: 300, expiry: addDays(900), brandName: 'Generic', sku: 'ALC-SWAB-GEN' });
  pushBatch({ id: 'b-nd-002', itemId: 'non-drug-002', batchNo: 'ND002-2401', quantity: 400, expiry: addDays(1200), brandName: 'BD', sku: 'SYR-5ML-BD' });
  pushBatch({ id: 'b-nd-003', itemId: 'non-drug-003', batchNo: 'ND003-2401', quantity: 500, expiry: addDays(1000), brandName: '3M', sku: 'MASK-3PLY-3M' });
  pushBatch({ id: 'b-nd-004', itemId: 'non-drug-004', batchNo: 'ND004-2401', quantity: 200, expiry: addDays(800), brandName: 'Johnson & Johnson', sku: 'GAUZE-4X4-JJ' });
  pushBatch({ id: 'b-nd-005', itemId: 'non-drug-005', batchNo: 'ND005-2401', quantity: 150, expiry: addDays(700), brandName: 'Elastoplast', sku: 'BAND-2IN-ELA' });
  pushBatch({ id: 'b-nd-006', itemId: 'non-drug-006', batchNo: 'ND006-2401', quantity: 300, expiry: addDays(600), brandName: 'Ansell', sku: 'GLOVE-NIT-L-ANS' });
  // Seed movements
  store.movements.push({ id: 'm-seed-1', time: '09:05', type: 'RECEIVE', item: 'Amlodipine 10mg', quantity: 500, location: 'Main Store' });
  store.movements.push({ id: 'm-seed-2', time: '09:10', type: 'RECEIVE', item: 'Paracetamol 500mg', quantity: 500, location: 'Main Store' });
  store.movements.push({ id: 'm-seed-3', time: '09:15', type: 'RECEIVE', item: 'Amoxicillin 250mg', quantity: 200, location: 'Main Store' });
  store.movements.push({ id: 'm-seed-4', time: '09:20', type: 'RECEIVE', item: 'Gauze Pad 4x4', quantity: 200, location: 'Main Store' });

  // Seed purchasing examples
  store.purchaseOrders.push({ id: 'PO-1001', supplier: 'PharmaOne', created: addDays(-20), expected: addDays(-3), status: 'OPEN', items: [ { itemId: 'drug-011', quantity: 200, received: 0 } ]});
  store.purchaseOrders.push({ id: 'PO-1002', supplier: 'MediSupply', created: addDays(-10), expected: addDays(2), status: 'PARTIAL', items: [ { itemId: 'drug-013', quantity: 120, received: 60 } ]});

  store.deliveryOrders.push({ id: 'DO-2001', poId: 'PO-1001', created: addDays(-4), expected: addDays(-3), status: 'PENDING', lines: [ { itemId: 'drug-011', quantity: 120, expiry: addDays(300) } ]});
  store.deliveryOrders.push({ id: 'DO-2002', poId: 'PO-1002', created: addDays(-2), expected: addDays(1), status: 'PENDING', lines: [ { itemId: 'drug-013', quantity: 60, expiry: addDays(180) } ]});

  store.requests.push({ id: 'REQ-1', department: 'Ward A', itemId: 'drug-021', quantity: 120, status: 'PENDING' });
  store.badStock.push({ id: 'BS-1', itemId: 'drug-025', quantity: 2, reason: 'DAMAGED', when: addDays(-1) });
  store.lous.push({ id: 'LOU-1', ref: 'LOU-ALPHA', supplier: 'PharmaOne', validFrom: addDays(-60), validTo: addDays(300) });
})();

export function getItems() { return store.items; }
export function getBatches() { return store.batches; }
export function getLocations() { return store.locations; }
export function getMovements() { return store.movements.slice(-20).reverse(); }
export function getPOs() { return store.purchaseOrders; }
export function getDOs() { return store.deliveryOrders; }
export function getInvoices() { return store.invoices; }
export function getRequests() { return store.requests; }
export function getBadStock() { return store.badStock; }
export function getLOUs() { return store.lous; }

export function onHandForItem(itemId: string): number {
  return store.batches.filter(b => b.itemId === itemId).reduce((s,b)=>s+b.quantity,0);
}

export function receiveGoods(params: { itemId: string; quantity: number; expiry: string; locationId: string }) {
  // Deterministic ID for demo to avoid hydration drift on first render
  const id = `b-${params.itemId}-${params.expiry}`;
  store.batches.push({ id, itemId: params.itemId, quantity: params.quantity, expiry: params.expiry });
  const item = store.items.find(i=>i.id===params.itemId);
  const loc = store.locations.find(l=>l.id===params.locationId);
  const base = new Date(process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T09:10:00Z');
  store.movements.push({ id: `m-receive-${params.itemId}-${params.expiry}`, time: base.toTimeString().slice(0,5), type: 'RECEIVE', item: item?.name || params.itemId, quantity: params.quantity, location: loc?.name || '' });
}

export function issueGoods(params: { itemId: string; quantity: number; destinationId: string; fefo?: boolean }) {
  const fefo = params.fefo !== false;
  const itemBatches = store.batches.filter(b => b.itemId === params.itemId).sort((a,b)=> new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
  let q = params.quantity;
  for (const b of itemBatches) {
    if (q<=0) break;
    const take = Math.min(b.quantity, q);
    b.quantity -= take;
    q -= take;
  }
  const item = store.items.find(i=>i.id===params.itemId);
  const loc = store.locations.find(l=>l.id===params.destinationId);
  const base = new Date(process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T10:10:00Z');
  store.movements.push({ id: `m-issue-${params.itemId}-${params.destinationId}-${params.quantity}`, time: base.toTimeString().slice(0,5), type: 'ISSUE', item: item?.name || params.itemId, quantity: params.quantity, location: loc?.name || '' });
}

export function adjustStock(params: { itemId: string; delta: number; reason: string }) {
  // apply to latest batch
  const batch = store.batches.find(b => b.itemId === params.itemId);
  if (!batch) return;
  batch.quantity += params.delta;
  const item = store.items.find(i=>i.id===params.itemId);
  const base = new Date(process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T11:10:00Z');
  store.movements.push({ id: `m-adjust-${params.itemId}-${params.delta}`, time: base.toTimeString().slice(0,5), type: 'ADJUST', item: item?.name || params.itemId, quantity: params.delta, location: 'Main Store' });
}

export function transferStock(params: { itemId: string; quantity: number; fromId: string; toId: string }) {
  // Simplified: just record movement
  const item = store.items.find(i=>i.id===params.itemId);
  const to = store.locations.find(l=>l.id===params.toId);
  const base = new Date(process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T12:10:00Z');
  store.movements.push({ id: `m-transfer-${params.itemId}-${params.toId}-${params.quantity}`, time: base.toTimeString().slice(0,5), type: 'TRANSFER', item: item?.name || params.itemId, quantity: params.quantity, location: to?.name || '' });
}

// Purchasing operations
export function createPO(params: { supplier: string; expected?: string; items: { itemId: string; quantity: number }[] }): PurchaseOrder {
  const id = `PO-${1000 + store.purchaseOrders.length + 1}`;
  const created = (process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T00:00:00Z').slice(0,10);
  const po: PurchaseOrder = { id, supplier: params.supplier, created, expected: params.expected, status: 'OPEN', items: params.items.map(it => ({ ...it, received: 0 })) };
  store.purchaseOrders.push(po);
  return po;
}

export function createDO(params: { poId: string; expected?: string; lines: { itemId: string; quantity: number; expiry: string }[] }): DeliveryOrder {
  const id = `DO-${2000 + store.deliveryOrders.length + 1}`;
  const created = (process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T00:00:00Z').slice(0,10);
  const dox: DeliveryOrder = { id, poId: params.poId, created, expected: params.expected, status: 'PENDING', lines: params.lines };
  store.deliveryOrders.push(dox);
  return dox;
}

export function receiveDO(params: { doId: string; locationId: string }): { penalty: boolean } {
  const d = store.deliveryOrders.find(x => x.id === params.doId);
  if (!d) return { penalty: false };
  if (d.status === 'RECEIVED') return { penalty: false };
  // Receive lines into stock
  for (const ln of d.lines) {
    receiveGoods({ itemId: ln.itemId, quantity: ln.quantity, expiry: ln.expiry, locationId: params.locationId });
    // Update PO received
    const po = store.purchaseOrders.find(p => p.id === d.poId);
    const it = po?.items.find(i => i.itemId === ln.itemId);
    if (it) it.received += ln.quantity;
  }
  d.status = 'RECEIVED';
  // Update PO status
  const po = store.purchaseOrders.find(p => p.id === d.poId);
  if (po) {
    const all = po.items.every(i => i.received >= i.quantity);
    const any = po.items.some(i => i.received > 0 && i.received < i.quantity);
    po.status = all ? 'COMPLETED' : any ? 'PARTIAL' : 'OPEN';
  }
  // Create invoice (unpaid)
  store.invoices.push({ id: `INV-${3000 + store.invoices.length + 1}`, doId: d.id, amount: d.lines.reduce((s,l)=> s + l.quantity * 1, 0), paid: false });
  // Penalty if expected in past
  const base = new Date(process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T00:00:00Z');
  const expected = d.expected ? new Date(d.expected) : base;
  return { penalty: expected < base };
}

export function markInvoicePaid(invId: string) {
  const inv = store.invoices.find(i => i.id === invId);
  if (inv) inv.paid = true;
}

export function logBadStock(params: { itemId: string; quantity: number; reason: BadStockIncident['reason']; when?: string }) {
  const when = params.when || (process.env.NEXT_PUBLIC_DEMO_DATE || '2025-09-01T00:00:00Z').slice(0,10);
  store.badStock.push({ id: `BS-${store.badStock.length + 1}`, itemId: params.itemId, quantity: params.quantity, reason: params.reason, when });
  adjustStock({ itemId: params.itemId, delta: -Math.abs(params.quantity), reason: params.reason });
}

export function addLOU(params: { ref: string; supplier: string; validFrom: string; validTo: string }) {
  store.lous.push({ id: `LOU-${store.lous.length + 1}`, ...params });
}

// Generate realistic department requests
function generateDepartmentRequests(): DepartmentRequest[] {
  const departments = [
    { name: 'ETU', staff: ['Dr. Sarah Ahmad', 'Dr. Ahmad Rahman', 'Nurse Fatimah Ali', 'Nurse Lisa Wong'] },
    { name: 'ICU', staff: ['Dr. Michael Chen', 'Dr. Priya Patel', 'Nurse John Smith', 'Nurse Maria Garcia'] },
    { name: 'WARD A', staff: ['Dr. David Lee', 'Nurse Sarah Johnson', 'Nurse Robert Brown', 'Nurse Emily Davis'] },
    { name: 'WARD B', staff: ['Dr. Jennifer Wilson', 'Nurse James Taylor', 'Nurse Linda Anderson', 'Nurse Thomas Miller'] },
    { name: 'OT', staff: ['Dr. Lisa Wong', 'Dr. Kevin Park', 'Nurse Amanda White', 'Nurse Daniel Clark'] },
    { name: 'CARDIOLOGY', staff: ['Dr. Robert Kim', 'Dr. Susan Martinez', 'Nurse Christopher Lee', 'Nurse Jessica Rodriguez'] },
    { name: 'NEUROLOGY', staff: ['Dr. Mark Thompson', 'Dr. Rachel Green', 'Nurse Matthew Wilson', 'Nurse Ashley Brown'] },
    { name: 'PEDIATRICS', staff: ['Dr. Jennifer Adams', 'Dr. Kevin Johnson', 'Nurse Sarah Miller', 'Nurse Michael Davis'] },
    { name: 'ONCOLOGY', staff: ['Dr. Patricia Garcia', 'Dr. Steven Martinez', 'Nurse Lisa Anderson', 'Nurse David Taylor'] },
    { name: 'EMERGENCY', staff: ['Dr. James Wilson', 'Dr. Maria Rodriguez', 'Nurse John Brown', 'Nurse Sarah Garcia'] }
  ];

  const priorities: RequestPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const statuses: RequestStatus[] = ['PENDING_REVIEW', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'REJECTED'];
  
  const requests: DepartmentRequest[] = [];
  
  // Generate 25-30 realistic requests
  for (let i = 1; i <= 28; i++) {
    // For first 5 requests, use high-volume departments and higher priority
    let dept, staff, priority, itemCount: number;
    
    if (i <= 5) {
      // First 5 requests will have 20-35 items from high-volume departments
      const highVolumeDepts = departments.filter(d => 
        ['ICU', 'ETU', 'EMERGENCY', 'OT', 'CARDIOLOGY'].includes(d.name)
      );
      dept = highVolumeDepts[Math.floor(Math.random() * highVolumeDepts.length)];
      staff = dept.staff[Math.floor(Math.random() * dept.staff.length)];
      priority = ['HIGH', 'URGENT'][Math.floor(Math.random() * 2)]; // Higher priority
      itemCount = Math.floor(Math.random() * 16) + 20; // 20-35 items
    } else {
      // Remaining requests have normal distribution
      dept = departments[Math.floor(Math.random() * departments.length)];
      staff = dept.staff[Math.floor(Math.random() * dept.staff.length)];
      priority = priorities[Math.floor(Math.random() * priorities.length)];
      itemCount = Math.floor(Math.random() * 18) + 8; // 8-25 items
    }
    
    // Ensure first 8 requests are ISSUED to guarantee variance reports
    let status: RequestStatus;
    if (i <= 8) {
      status = 'ISSUED';
    } else {
      status = statuses[Math.floor(Math.random() * statuses.length)];
    }
    const items: RequestItem[] = [];
    
    // Mix of drug and non-drug items
    const drugItems = store.items.filter(item => item.category === 'Drug');
    const nonDrugItems = store.items.filter(item => item.category === 'Non-drug');
    
    for (let j = 0; j < itemCount; j++) {
      const isDrug = Math.random() < 0.7; // 70% drugs, 30% non-drugs
      const itemPool = isDrug ? drugItems : nonDrugItems;
      const item = itemPool[Math.floor(Math.random() * itemPool.length)];
      
      // Realistic quantity ranges based on item type
      let quantity: number;
      if (isDrug) {
        if (item.name.includes('mg') && item.name.includes('Tablet')) {
          quantity = Math.floor(Math.random() * 500) + 100; // 100-600 tablets
        } else if (item.name.includes('Injection')) {
          quantity = Math.floor(Math.random() * 50) + 10; // 10-60 vials
        } else if (item.name.includes('Capsule')) {
          quantity = Math.floor(Math.random() * 300) + 50; // 50-350 capsules
        } else {
          quantity = Math.floor(Math.random() * 200) + 50; // 50-250 units
        }
      } else {
        // Non-drug items - higher quantities
        if (item.name.includes('Syringe') || item.name.includes('Needle')) {
          quantity = Math.floor(Math.random() * 200) + 100; // 100-300 units
        } else if (item.name.includes('Gauze') || item.name.includes('Bandage')) {
          quantity = Math.floor(Math.random() * 100) + 50; // 50-150 units
        } else if (item.name.includes('Gloves') || item.name.includes('Mask')) {
          quantity = Math.floor(Math.random() * 500) + 200; // 200-700 units
        } else {
          quantity = Math.floor(Math.random() * 150) + 25; // 25-175 units
        }
      }
      
      const unit = isDrug ? 
        (item.name.includes('Injection') ? 'vials' : 
         item.name.includes('Inhaler') ? 'units' : 'tablets') :
        (item.name.includes('Syringe') ? 'units' :
         item.name.includes('Gloves') ? 'pairs' :
         item.name.includes('Gauze') ? 'pads' : 'units');
      
      items.push({
        id: `req-item-${i}-${j}`,
        itemId: item.id,
        itemName: item.name,
        drugCode: item.drugCode,
        dosageForm: item.dosageForm,
        requestedQuantity: quantity,
        approvedQuantity: status === 'APPROVED' || status === 'ISSUED' ? 
          Math.floor(quantity * (0.8 + Math.random() * 0.4)) : undefined, // 80-120% of requested
        unit,
        status: status === 'PENDING_REVIEW' ? 'PENDING' :
                status === 'UNDER_REVIEW' ? 'PENDING' :
                status === 'PENDING_APPROVAL' ? 'PENDING' :
                status === 'APPROVED' ? 'APPROVED' :
                status === 'ISSUED' ? 'ISSUED' : 'REJECTED',
        notes: Math.random() < 0.3 ? 
          (isDrug ? 
            ['For patient treatment', 'Regular medication', 'Emergency supply', 'Scheduled procedure'][Math.floor(Math.random() * 4)] :
            ['Routine supply', 'Emergency equipment', 'Maintenance stock', 'Patient care'][Math.floor(Math.random() * 4)]
          ) : undefined
      });
    }
    
    // Generate realistic dates (last 30 days)
    const daysAgo = Math.floor(Math.random() * 30);
    const requestDate = new Date();
    requestDate.setDate(requestDate.getDate() - daysAgo);
    requestDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
    
    const updateDate = new Date(requestDate);
    if (status !== 'PENDING_REVIEW') {
      updateDate.setHours(updateDate.getHours() + Math.floor(Math.random() * 48) + 1);
    }
    
    // Add rejection reason for rejected requests
    const rejectionReasons = [
      'Insufficient stock available for requested quantities',
      'Requested items not available in current inventory',
      'Budget constraints - request exceeds allocated department budget',
      'Items requested are not approved for this department',
      'Requested quantities exceed maximum allowed per request',
      'Required documentation incomplete or missing',
      'Items requested are currently under quarantine',
      'Request does not meet minimum order requirements',
      'Requested items are discontinued or no longer available',
      'Emergency request not justified - regular procurement process required'
    ];

    const request: DepartmentRequest = {
      id: `req-${String(i).padStart(3, '0')}`,
      requestNumber: `REQ-2024-${String(i).padStart(3, '0')}`,
      department: dept.name,
      requestedBy: staff,
      requestedAt: requestDate.toISOString(),
      priority,
      status,
      items,
      notes: Math.random() < 0.4 ? 
        ['Urgent patient care', 'Regular ward supply', 'Emergency department needs', 'Scheduled surgery', 'Critical care requirements'][Math.floor(Math.random() * 5)] : undefined,
      rejectionReason: status === 'REJECTED' ? rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)] : undefined,
      createdAt: requestDate.toISOString(),
      updatedAt: updateDate.toISOString()
    };
    
    requests.push(request);
  }
  
  return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

// Generate realistic variance reports
function generateVarianceReports(): VarianceReport[] {
  const varianceReports: VarianceReport[] = [];
  
  // Get issued requests to create variances for
  const issuedRequests = store.departmentRequests.filter(r => r.status === 'ISSUED');
  
  // Ensure we have at least 3 variance reports
  const minReports = 3;
  let reportCount = 0;
  
  // Create variance reports for issued requests
  for (const request of issuedRequests) {
    if (reportCount >= minReports) break;
    
    // Create variances for 1-3 items per request
    const itemsToVary = request.items.slice(0, Math.min(3, request.items.length));
    
    for (const item of itemsToVary) {
      if (reportCount >= minReports) break;
      
      const approvedQty = item.approvedQuantity || item.requestedQuantity;
      const issuedQty = Math.floor(approvedQty * (0.7 + Math.random() * 0.6)); // 70-130% of approved
      const variance = approvedQty - issuedQty;
      const variancePercentage = ((variance / approvedQty) * 100);
      
      // Add realistic reasons for variances
      const varianceReasons = [
        'Stock shortage during issuance',
        'Damaged items found during quality check',
        'Expired batch discovered during issuing',
        'Partial delivery from supplier',
        'Items reserved for emergency cases',
        'Quality control rejection',
        'Inventory discrepancy found',
        'Items under quarantine',
        'Supplier delivery shortfall',
        'Emergency allocation to critical cases'
      ];
      
      const varianceReport: VarianceReport = {
        id: `var-${varianceReports.length + 1}`,
        requestId: request.id,
        itemId: item.itemId,
        itemName: item.itemName,
        requestedQuantity: item.requestedQuantity,
        approvedQuantity: approvedQty,
        issuedQuantity: issuedQty,
        variance,
        variancePercentage,
        reason: Math.random() < 0.8 ? varianceReasons[Math.floor(Math.random() * varianceReasons.length)] : undefined,
        createdAt: new Date(request.updatedAt).toISOString()
      };
      
      varianceReports.push(varianceReport);
      reportCount++;
    }
  }
  
  return varianceReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// New workflow functions
export function getDepartmentRequests(): DepartmentRequest[] {
  if (store.departmentRequests.length === 0) {
    store.departmentRequests = generateDepartmentRequests();
  }
  return store.departmentRequests;
}

export function getApprovalRequests(): ApprovalRequest[] {
  return store.approvalRequests;
}

export function getIssueRequests(): IssueRequest[] {
  return store.issueRequests;
}

export function getVarianceReports(): VarianceReport[] {
  if (store.varianceReports.length === 0) {
    store.varianceReports = generateVarianceReports();
  }
  return store.varianceReports;
}

export function getRequestStats(): RequestStats {
  const requests = store.departmentRequests;
  const now = new Date();
  
  const stats = {
    totalRequests: requests.length,
    pendingReview: requests.filter(r => r.status === 'PENDING_REVIEW').length,
    underReview: requests.filter(r => r.status === 'UNDER_REVIEW').length,
    pendingApproval: requests.filter(r => r.status === 'PENDING_APPROVAL').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    issued: requests.filter(r => r.status === 'ISSUED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
    averageProcessingTime: 0
  };

  // Calculate average processing time for completed requests
  const completedRequests = requests.filter(r => ['ISSUED', 'REJECTED'].includes(r.status));
  if (completedRequests.length > 0) {
    const totalHours = completedRequests.reduce((sum, req) => {
      const created = new Date(req.createdAt);
      const updated = new Date(req.updatedAt);
      return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
    }, 0);
    stats.averageProcessingTime = Math.round(totalHours / completedRequests.length);
  }

  return stats;
}

export function updateRequestStatus(requestId: string, status: RequestStatus, updatedBy?: string, rejectionReason?: string): boolean {
  const request = store.departmentRequests.find(r => r.id === requestId);
  if (!request) return false;
  
  request.status = status;
  request.updatedAt = new Date().toISOString();
  
  // Add rejection reason if status is REJECTED
  if (status === 'REJECTED' && rejectionReason) {
    request.rejectionReason = rejectionReason;
  }
  
  return true;
}

export function createApprovalRequest(requestId: string, reviewedBy: string, modifications: RequestItemModification[], reviewNotes?: string): boolean {
  const request = store.departmentRequests.find(r => r.id === requestId);
  if (!request) return false;
  
  const approvalRequest: ApprovalRequest = {
    id: `appr-${store.approvalRequests.length + 1}`,
    requestId,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    modifications,
    reviewNotes,
    status: 'PENDING_APPROVAL'
  };
  
  store.approvalRequests.push(approvalRequest);
  
  // Update request status
  request.status = 'PENDING_APPROVAL';
  request.updatedAt = new Date().toISOString();
  
  return true;
}

export function approveRequest(requestId: string, approvedBy: string): boolean {
  const request = store.departmentRequests.find(r => r.id === requestId);
  const approvalRequest = store.approvalRequests.find(a => a.requestId === requestId);
  
  if (!request || !approvalRequest) return false;
  
  approvalRequest.status = 'APPROVED';
  request.status = 'APPROVED';
  request.updatedAt = new Date().toISOString();
  
  return true;
}

export function createIssueRequest(requestId: string, issuedBy: string, items: IssuedItem[], location: string, notes?: string): boolean {
  const request = store.departmentRequests.find(r => r.id === requestId);
  if (!request || request.status !== 'APPROVED') return false;
  
  const issueRequest: IssueRequest = {
    id: `issue-${store.issueRequests.length + 1}`,
    requestId,
    issuedBy,
    issuedAt: new Date().toISOString(),
    items,
    location,
    notes
  };
  
  store.issueRequests.push(issueRequest);
  
  // Update request status
  request.status = 'ISSUED';
  request.updatedAt = new Date().toISOString();
  
  // Create variance reports
  request.items.forEach(reqItem => {
    const issuedItem = items.find(i => i.itemId === reqItem.itemId);
    if (issuedItem) {
      const variance = (reqItem.approvedQuantity || reqItem.requestedQuantity) - issuedItem.quantity;
      const variancePercentage = ((variance / (reqItem.approvedQuantity || reqItem.requestedQuantity)) * 100);
      
      const varianceReport: VarianceReport = {
        id: `var-${store.varianceReports.length + 1}`,
        requestId,
        itemId: reqItem.itemId,
        itemName: reqItem.itemName,
        requestedQuantity: reqItem.requestedQuantity,
        approvedQuantity: reqItem.approvedQuantity || reqItem.requestedQuantity,
        issuedQuantity: issuedItem.quantity,
        variance,
        variancePercentage,
        createdAt: new Date().toISOString()
      };
      
      store.varianceReports.push(varianceReport);
    }
  });
  
  return true;
}



