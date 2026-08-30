// src/modules/mypriviledging/types/priviledgingTypes.ts
// Clinical Credentialing & Privileging Types for H.O.M.E.

export type CredentialRole = 'nurses' | 'amos' | 'allied_health' | 'both';

export type SupervisionLevel =
  | 'level_1_observed'          // Tahap 1: Diperhatikan Sahaja (Observed)
  | 'level_2_direct_supervision' // Tahap 2: Di Bawah Pengawasan Terus (Direct Supervision)
  | 'level_3_indirect_supervision' // Tahap 3: Pengawasan Tidak Terus (Indirect Supervision)
  | 'level_4_independent';      // Tahap 4: Kompeten & Mandiri (Independent Practice)

export type SubmissionStatus =
  | 'draft'             // Draf (belum dihantar)
  | 'pending'           // Menunggu Semakan Admin / JKCP
  | 'changes_requested' // Perlu Pindaan / Maklum Balas
  | 'approved'          // Diluluskan & Ditauliahkan
  | 'rejected';         // Ditolak

export type PrivilegingLevel =
  | 'core'        // Prosedur Teras (Core Privileges)
  | 'specialized' // Prosedur Khusus / Lanjutan (Specialized Privileges)
  | 'conditional' // Bersyarat / Di Bawah Pengawasan (Conditional)
  | 'optional';   // Pilihan (Optional)

export interface ProcedureItem {
  id: string;
  label: string;
  code?: string;
  description?: string;
  requiredObservations?: number;
  requiredSupervised?: number;
  requiredIndependent?: number;
}

export interface ProcedureGroup {
  label: string;
  items: ProcedureItem[];
}

export interface ProcedureCategory {
  id: string;
  name: string;
  summary: string;
  applicableRole: CredentialRole;
  iconName?: string;
  groups: ProcedureGroup[];
}

export interface ProcedureAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
}

export interface ProcedureSubmission {
  id: string;
  staffId: string;
  staffName: string;
  staffIc: string;
  staffGrade: string;
  staffRegistrationNo: string; // LJM (Nurses) or LPPPM (AMOs)
  staffApcNo: string;
  staffDepartment: string;
  staffRole: CredentialRole;
  
  // Procedure details
  categoryId: string;
  categoryName: string;
  procedureKey: string;
  procedureName: string;
  isCustomProcedure?: boolean;
  
  // Execution Log details
  supervisionLevel: SupervisionLevel;
  procedureDate: string;
  patientIdentifier?: string; // e.g. MRN or case ID (anonymized)
  clinicalPlan: string;
  equipmentUsed: string;
  complicationsOrNotes?: string;
  attachments: ProcedureAttachment[];
  
  // Status & Review Lifecycle
  status: SubmissionStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Admin Endorsement Details
  review?: PrivilegingReview;
}

export interface PrivilegingReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  decision: 'approved' | 'changes_requested' | 'rejected';
  adminNotes: string;
  privilegingLevel?: PrivilegingLevel;
  validityStartDate?: string;
  validityEndDate?: string;
  validityYears?: number; // 1, 2, or 3 years
  reviewedAt: string;
}

export interface StaffPrivilegingProfile {
  id: string;
  fullName: string;
  icNumber: string;
  email: string;
  phone: string;
  department: string;
  departmentId?: string;
  position: string;
  grade: string;
  role: CredentialRole;
  boardRegistrationNo: string; // LJM / LPPPM
  apcNumber: string;
  apcExpiryDate: string;
  supervisorName?: string;
  totalLogged: number;
  approvedCount: number;
  pendingCount: number;
  changesCount: number;
  lastUpdated: string;
  certificateRefNo?: string;
  privilegingStatus: 'active' | 'pending_renewal' | 'expired' | 'in_progress';
}

export interface PrivilegingCertificateData {
  certificateNo: string;
  referenceNo: string;
  issueDate: string;
  expiryDate: string;
  staff: StaffPrivilegingProfile;
  approvedProcedures: {
    categoryName: string;
    procedures: {
      name: string;
      level: PrivilegingLevel;
      approvedDate: string;
      validUntil: string;
    }[];
  }[];
  jkcpChairperson: {
    name: string;
    designation: string;
  };
  hospitalDirector: {
    name: string;
    designation: string;
  };
  hospitalName: string;
  ministryName: string;
  qrVerificationUrl: string;
}

export interface PrivilegingKPIs {
  totalStaff: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  changesRequestedSubmissions: number;
  activePrivilegedStaff: number;
  approvalRatePercentage: number;
}
