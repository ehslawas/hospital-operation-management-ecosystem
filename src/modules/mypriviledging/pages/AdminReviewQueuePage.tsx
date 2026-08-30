// src/modules/mypriviledging/pages/AdminReviewQueuePage.tsx
// Dedicated Admin & JKCP Committee Verification and Review Center

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PriviledgingHeader,
  SubmissionsTable,
  ReviewSubmissionModal
} from '../components';
import { priviledgingService } from '../services/priviledgingService';
import type {
  ProcedureSubmission,
  PrivilegingLevel
} from '../types/priviledgingTypes';
import { ShieldCheck } from 'lucide-react';

export const AdminReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<ProcedureSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [reviewingSubmission, setReviewingSubmission] = useState<ProcedureSubmission | null>(null);

  const loadData = () => {
    const allSubs = priviledgingService.getAllSubmissions();
    setSubmissions(allSubs);
  };

  useEffect(() => {
    priviledgingService.setActiveMode('admin');
    loadData();
  }, []);

  const kpis = useMemo(() => {
    return priviledgingService.getKpis();
  }, [submissions]);

  const handleRecordReviewDecision = (params: {
    submissionId: string;
    decision: 'approved' | 'changes_requested' | 'rejected';
    adminNotes: string;
    privilegingLevel?: PrivilegingLevel;
    validityYears?: number;
  }) => {
    priviledgingService.recordReviewDecision({
      ...params,
      reviewerId: 'admin-jkcp-01',
      reviewerName: 'Matron Hasnah binti Kassim (JKCP)',
      reviewerRole: 'Penyelia Jururawat Hospital Lawas'
    });
    loadData();
  };

  return (
    <div className="min-h-screen pb-12">
      <PriviledgingHeader
        isAdminMode={true}
        pendingReviewsCount={kpis.pendingSubmissions}
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              Pusat Semakan JKCP & Kelulusan Privileging
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Penilaian bukti log prosedur, penetapan tempoh sahlaku, dan penganugerahan Surat Penurunan Kuasa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800">
            {kpis.pendingSubmissions} Prosedur Menunggu Tindakan
          </span>
        </div>
      </div>

      <SubmissionsTable
        submissions={submissions}
        isAdminMode={true}
        activeStatusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onReviewSubmission={(sub) => setReviewingSubmission(sub)}
        onViewCertificate={(staffId) => navigate(`/priviledging/print/${staffId}`)}
      />

      <ReviewSubmissionModal
        isOpen={!!reviewingSubmission}
        onClose={() => setReviewingSubmission(null)}
        submission={reviewingSubmission}
        onRecordDecision={handleRecordReviewDecision}
      />
    </div>
  );
};

export default AdminReviewQueuePage;
