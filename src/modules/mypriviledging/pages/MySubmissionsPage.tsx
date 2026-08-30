// src/modules/mypriviledging/pages/MySubmissionsPage.tsx
// User's dedicated logbook and procedure submissions management

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PriviledgingHeader,
  PriviledgingKpiCards,
  SubmissionsTable,
  SubmitProcedureModal
} from '../components';
import { priviledgingService } from '../services/priviledgingService';
import type {
  ProcedureSubmission,
  StaffPrivilegingProfile
} from '../types/priviledgingTypes';
import { FileCheck2, Plus } from 'lucide-react';

export const MySubmissionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<ProcedureSubmission[]>([]);
  const [activeStaff, setActiveStaff] = useState<StaffPrivilegingProfile | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [editingSubmission, setEditingSubmission] = useState<ProcedureSubmission | null>(null);

  const loadData = () => {
    const allStaff = priviledgingService.getAllStaffProfiles();
    const current = allStaff[0];
    setActiveStaff(current);
    if (current) {
      const userSubs = priviledgingService.getSubmissionsByStaff(current.id);
      setSubmissions(userSubs);
    }
  };

  useEffect(() => {
    priviledgingService.setActiveMode('staff');
    loadData();
  }, []);

  const kpis = useMemo(() => {
    return priviledgingService.getKpis();
  }, [submissions]);

  const handleSaveSubmission = (data: Partial<ProcedureSubmission>, isDraft: boolean) => {
    priviledgingService.saveSubmission(data as any);
    loadData();
  };

  const handleSubmitDraft = (id: string) => {
    priviledgingService.submitDraftForReview(id);
    loadData();
  };

  const handleDeleteSubmission = (id: string) => {
    if (window.confirm('Adakah anda pasti ingin memadam rekod prosedur ini?')) {
      priviledgingService.deleteSubmission(id);
      loadData();
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <PriviledgingHeader
        onOpenSubmitModal={() => {
          setEditingSubmission(null);
          setIsSubmitModalOpen(true);
        }}
        pendingReviewsCount={kpis.pendingSubmissions}
        changesCount={activeStaff?.changesCount || 0}
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              Buku Log & Permohonan Prosedur Saya
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Semak rekod prosedur yang telah disimpan sebagai draf, dihantar untuk semakan, atau diluluskan.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingSubmission(null);
            setIsSubmitModalOpen(true);
          }}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Log Prosedur Baru</span>
        </button>
      </div>

      <PriviledgingKpiCards
        isAdminMode={false}
        kpis={kpis}
        activeStaff={activeStaff}
        onFilterClick={(st) => setStatusFilter(st)}
      />

      <SubmissionsTable
        submissions={submissions}
        isAdminMode={false}
        activeStatusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onEditSubmission={(sub) => {
          setEditingSubmission(sub);
          setIsSubmitModalOpen(true);
        }}
        onSubmitDraft={handleSubmitDraft}
        onDeleteSubmission={handleDeleteSubmission}
        onViewCertificate={(staffId) => navigate(`/priviledging/print/${staffId}`)}
      />

      <SubmitProcedureModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setEditingSubmission(null);
        }}
        onSave={handleSaveSubmission}
        editingSubmission={editingSubmission}
        activeStaff={activeStaff}
      />
    </div>
  );
};

export default MySubmissionsPage;
