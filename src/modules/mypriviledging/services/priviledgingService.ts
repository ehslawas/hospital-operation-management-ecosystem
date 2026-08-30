// src/modules/mypriviledging/services/priviledgingService.ts
// Service Layer for Clinical Credentialing & Privileging (MyPriviledging)
// Handles Persistence, Status Transitions, Admin Endorsement & Certificate Generation

import type {
  ProcedureSubmission,
  StaffPrivilegingProfile,
  PrivilegingReview,
  PrivilegingCertificateData,
  PrivilegingKPIs,
  SubmissionStatus,
  PrivilegingLevel
} from '../types/priviledgingTypes';
import {
  PRIVILEDGING_STORAGE_KEY,
  DEFAULT_STAFF_PROFILES,
  DEFAULT_SUBMISSIONS
} from '../data/defaultPriviledgingData';

interface StoredPriviledgingState {
  version: string;
  staffProfiles: StaffPrivilegingProfile[];
  submissions: ProcedureSubmission[];
  lastSynced: string;
}

const STORAGE_VERSION = 'v1.0';

/**
 * Initialize storage with default mock data if not present or outdated
 */
const getStoredState = (): StoredPriviledgingState => {
  try {
    const raw = localStorage.getItem(PRIVILEDGING_STORAGE_KEY);
    if (!raw) {
      const initialState: StoredPriviledgingState = {
        version: STORAGE_VERSION,
        staffProfiles: DEFAULT_STAFF_PROFILES,
        submissions: DEFAULT_SUBMISSIONS,
        lastSynced: new Date().toISOString()
      };
      localStorage.setItem(PRIVILEDGING_STORAGE_KEY, JSON.stringify(initialState));
      return initialState;
    }

    const parsed: StoredPriviledgingState = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.submissions)) {
      const resetState: StoredPriviledgingState = {
        version: STORAGE_VERSION,
        staffProfiles: DEFAULT_STAFF_PROFILES,
        submissions: DEFAULT_SUBMISSIONS,
        lastSynced: new Date().toISOString()
      };
      localStorage.setItem(PRIVILEDGING_STORAGE_KEY, JSON.stringify(resetState));
      return resetState;
    }

    return parsed;
  } catch (err) {
    console.error('[MyPriviledging] Failed to load local state:', err);
    return {
      version: STORAGE_VERSION,
      staffProfiles: DEFAULT_STAFF_PROFILES,
      submissions: DEFAULT_SUBMISSIONS,
      lastSynced: new Date().toISOString()
    };
  }
};

const saveState = (state: StoredPriviledgingState): void => {
  try {
    state.lastSynced = new Date().toISOString();
    localStorage.setItem(PRIVILEDGING_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[MyPriviledging] Failed to persist local state:', err);
  }
};

export const priviledgingService = {
  /**
   * Reset data to default seed structures
   */
  resetToDefault(): void {
    const initialState: StoredPriviledgingState = {
      version: STORAGE_VERSION,
      staffProfiles: DEFAULT_STAFF_PROFILES,
      submissions: DEFAULT_SUBMISSIONS,
      lastSynced: new Date().toISOString()
    };
    saveState(initialState);
  },

  /**
   * Get all submissions across hospital
   */
  getAllSubmissions(): ProcedureSubmission[] {
    const state = getStoredState();
    return state.submissions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  /**
   * Get submissions for a specific staff member
   */
  getSubmissionsByStaff(staffId: string): ProcedureSubmission[] {
    const state = getStoredState();
    return state.submissions
      .filter((s) => s.staffId === staffId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  /**
   * Get single submission by ID
   */
  getSubmissionById(id: string): ProcedureSubmission | undefined {
    const state = getStoredState();
    return state.submissions.find((s) => s.id === id);
  },

  /**
   * Create or update a submission (Draft or Pending)
   */
  saveSubmission(
    submissionData: Omit<ProcedureSubmission, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): ProcedureSubmission {
    const state = getStoredState();
    const now = new Date().toISOString();

    let targetSubmission: ProcedureSubmission;

    if (submissionData.id) {
      // Update existing
      const index = state.submissions.findIndex((s) => s.id === submissionData.id);
      if (index === -1) {
        throw new Error(`Submission ${submissionData.id} not found.`);
      }

      targetSubmission = {
        ...state.submissions[index],
        ...submissionData,
        id: submissionData.id,
        updatedAt: now
      };

      // If re-submitting from changes_requested or draft to pending
      if (submissionData.status === 'pending' && !targetSubmission.submittedAt) {
        targetSubmission.submittedAt = now;
      }

      state.submissions[index] = targetSubmission;
    } else {
      // Create new
      const newId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      targetSubmission = {
        ...submissionData,
        id: newId,
        createdAt: now,
        updatedAt: now,
        submittedAt: submissionData.status === 'pending' ? now : undefined
      };
      state.submissions.unshift(targetSubmission);
    }

    // Refresh staff metrics
    this.refreshStaffCounts(targetSubmission.staffId, state);
    saveState(state);

    return targetSubmission;
  },

  /**
   * Submit an existing draft for Admin review
   */
  submitDraftForReview(submissionId: string): ProcedureSubmission {
    const state = getStoredState();
    const sub = state.submissions.find((s) => s.id === submissionId);
    if (!sub) {
      throw new Error(`Submission ${submissionId} not found.`);
    }

    sub.status = 'pending';
    sub.submittedAt = new Date().toISOString();
    sub.updatedAt = new Date().toISOString();

    this.refreshStaffCounts(sub.staffId, state);
    saveState(state);

    return sub;
  },

  /**
   * Delete a submission (e.g. draft)
   */
  deleteSubmission(submissionId: string): boolean {
    const state = getStoredState();
    const index = state.submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) return false;

    const [deleted] = state.submissions.splice(index, 1);
    this.refreshStaffCounts(deleted.staffId, state);
    saveState(state);

    return true;
  },

  /**
   * Admin Review Decision (Approve, Request Changes, Reject)
   */
  recordReviewDecision(params: {
    submissionId: string;
    reviewerId: string;
    reviewerName: string;
    reviewerRole: string;
    decision: 'approved' | 'changes_requested' | 'rejected';
    adminNotes: string;
    privilegingLevel?: PrivilegingLevel;
    validityYears?: number;
  }): ProcedureSubmission {
    const state = getStoredState();
    const sub = state.submissions.find((s) => s.id === params.submissionId);
    if (!sub) {
      throw new Error(`Submission ${params.submissionId} not found.`);
    }

    const now = new Date();
    const reviewedAt = now.toISOString();
    const validityYears = params.validityYears || 3;

    const startDate = now.toISOString().split('T')[0];
    const expiryDateObj = new Date(now);
    expiryDateObj.setFullYear(expiryDateObj.getFullYear() + validityYears);
    expiryDateObj.setDate(expiryDateObj.getDate() - 1);
    const endDate = expiryDateObj.toISOString().split('T')[0];

    const review: PrivilegingReview = {
      id: `rev-${Date.now()}`,
      submissionId: params.submissionId,
      reviewerId: params.reviewerId,
      reviewerName: params.reviewerName,
      reviewerRole: params.reviewerRole,
      decision: params.decision,
      adminNotes: params.adminNotes,
      privilegingLevel: params.decision === 'approved' ? (params.privilegingLevel || 'core') : undefined,
      validityStartDate: params.decision === 'approved' ? startDate : undefined,
      validityEndDate: params.decision === 'approved' ? endDate : undefined,
      validityYears: params.decision === 'approved' ? validityYears : undefined,
      reviewedAt
    };

    sub.status = params.decision;
    sub.review = review;
    sub.updatedAt = reviewedAt;

    this.refreshStaffCounts(sub.staffId, state);
    saveState(state);

    return sub;
  },

  /**
   * Helper to recalculate staff submission counts and privileging status
   */
  refreshStaffCounts(staffId: string, state: StoredPriviledgingState): void {
    const staff = state.staffProfiles.find((s) => s.id === staffId);
    if (!staff) return;

    const userSubs = state.submissions.filter((s) => s.staffId === staffId);
    staff.totalLogged = userSubs.length;
    staff.approvedCount = userSubs.filter((s) => s.status === 'approved').length;
    staff.pendingCount = userSubs.filter((s) => s.status === 'pending').length;
    staff.changesCount = userSubs.filter((s) => s.status === 'changes_requested').length;
    staff.lastUpdated = new Date().toISOString();

    if (staff.approvedCount >= 5) {
      staff.privilegingStatus = 'active';
    } else if (staff.approvedCount > 0) {
      staff.privilegingStatus = 'in_progress';
    }
  },

  /**
   * Get all registered staff profiles
   */
  getAllStaffProfiles(): StaffPrivilegingProfile[] {
    const state = getStoredState();
    return state.staffProfiles;
  },

  /**
   * Get staff profile by ID
   */
  getStaffProfileById(staffId: string): StaffPrivilegingProfile | undefined {
    const state = getStoredState();
    return state.staffProfiles.find((s) => s.id === staffId);
  },

  /**
   * Update staff profile info
   */
  updateStaffProfile(profile: StaffPrivilegingProfile): StaffPrivilegingProfile {
    const state = getStoredState();
    const index = state.staffProfiles.findIndex((s) => s.id === profile.id);
    if (index === -1) {
      state.staffProfiles.push(profile);
    } else {
      state.staffProfiles[index] = { ...profile, lastUpdated: new Date().toISOString() };
    }
    saveState(state);
    return profile;
  },

  /**
   * Generate official KKM Privileging Certificate Data
   */
  getCertificateDataForStaff(staffId: string): PrivilegingCertificateData | null {
    const state = getStoredState();
    const staff = state.staffProfiles.find((s) => s.id === staffId);
    if (!staff) return null;

    const approvedSubs = state.submissions.filter(
      (s) => s.staffId === staffId && s.status === 'approved'
    );

    // Group approved procedures by Category
    const groupedMap = new Map<string, { name: string; level: PrivilegingLevel; approvedDate: string; validUntil: string }[]>();

    approvedSubs.forEach((sub) => {
      const catName = sub.categoryName || 'Prosedur Klinikal Umum';
      if (!groupedMap.has(catName)) {
        groupedMap.set(catName, []);
      }
      groupedMap.get(catName)!.push({
        name: sub.procedureName,
        level: sub.review?.privilegingLevel || 'core',
        approvedDate: sub.review?.validityStartDate || sub.procedureDate,
        validUntil: sub.review?.validityEndDate || '2029-12-31'
      });
    });

    const approvedProcedures = Array.from(groupedMap.entries()).map(([categoryName, procedures]) => ({
      categoryName,
      procedures
    }));

    const issueYear = new Date().getFullYear();
    const certNumber = staff.certificateRefNo || `KKM/HL/JKCP/${issueYear}/${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      certificateNo: certNumber,
      referenceNo: `SURAT PENURUNAN KUASA KLINIKAL (${certNumber})`,
      issueDate: '01 Januari ' + issueYear,
      expiryDate: '31 Disember ' + (issueYear + 3),
      staff,
      approvedProcedures,
      jkcpChairperson: {
        name: 'Dr. Nor Azman bin Sulaiman',
        designation: 'Pengerusi Jawatankuasa Credentialing & Privileging (JKCP) Hospital Lawas'
      },
      hospitalDirector: {
        name: 'Dr. Evelyn Tan Siew Lee',
        designation: 'Pengarah Hospital Lawas, Kementerian Kesihatan Malaysia'
      },
      hospitalName: 'HOSPITAL LAWAS',
      ministryName: 'KEMENTERIAN KESIHATAN MALAYSIA',
      qrVerificationUrl: `https://home-lawas.moh.gov.my/verify/priviledging/${encodeURIComponent(certNumber)}`
    };
  },

  /**
   * Get Hospital KPIs for Privileging
   */
  getKpis(): PrivilegingKPIs {
    const state = getStoredState();
    const totalStaff = state.staffProfiles.length;
    const totalSubmissions = state.submissions.length;
    const pendingSubmissions = state.submissions.filter((s) => s.status === 'pending').length;
    const approvedSubmissions = state.submissions.filter((s) => s.status === 'approved').length;
    const changesRequestedSubmissions = state.submissions.filter((s) => s.status === 'changes_requested').length;
    const activePrivilegedStaff = state.staffProfiles.filter((s) => s.privilegingStatus === 'active').length;

    const evaluatedCount = approvedSubmissions + state.submissions.filter((s) => s.status === 'rejected').length;
    const approvalRatePercentage = evaluatedCount > 0 ? Math.round((approvedSubmissions / evaluatedCount) * 100) : 100;

    return {
      totalStaff,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      changesRequestedSubmissions,
      activePrivilegedStaff,
      approvalRatePercentage
    };
  },

  /**
   * Get Active Mode (Staff vs Admin)
   */
  getActiveMode(): 'staff' | 'admin' {
    try {
      const mode = localStorage.getItem('home_mypriviledging_role_mode');
      return mode === 'admin' ? 'admin' : 'staff';
    } catch {
      return 'staff';
    }
  },

  /**
   * Set Active Mode and notify listeners
   */
  setActiveMode(mode: 'staff' | 'admin'): void {
    try {
      localStorage.setItem('home_mypriviledging_role_mode', mode);
      window.dispatchEvent(new CustomEvent('priviledging_mode_change', { detail: mode }));
    } catch (err) {
      console.error('[MyPriviledging] Failed to set mode:', err);
    }
  }
};
