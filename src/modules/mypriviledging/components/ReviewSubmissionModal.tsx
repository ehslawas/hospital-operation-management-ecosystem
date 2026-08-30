// src/modules/mypriviledging/components/ReviewSubmissionModal.tsx
// Admin verification & clinical endorsement drawer/modal for JKCP committee members

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Building,
  User,
  Paperclip,
  Award,
  Sparkles,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ProcedureSubmission,
  PrivilegingLevel
} from '../types/priviledgingTypes';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ProcedureSubmission | null;
  onRecordDecision: (params: {
    submissionId: string;
    decision: 'approved' | 'changes_requested' | 'rejected';
    adminNotes: string;
    privilegingLevel?: PrivilegingLevel;
    validityYears?: number;
  }) => void;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  onRecordDecision
}) => {
  const [decision, setDecision] = useState<'approved' | 'changes_requested' | 'rejected'>('approved');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [privilegingLevel, setPrivilegingLevel] = useState<PrivilegingLevel>('core');
  const [validityYears, setValidityYears] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !submission) return;
    setDecision('approved');
    setAdminNotes(
      'Kompetensi klinikal dan rekod log prosedur disemak serta diperakui memenuhi standard Credentialing & Privileging Hospital Lawas.'
    );
    setPrivilegingLevel('core');
    setValidityYears(3);
    setErrorMsg('');
  }, [isOpen, submission]);

  if (!isOpen || !submission) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (decision !== 'approved' && !adminNotes.trim()) {
      setErrorMsg('Sila nyatakan ulasan atau catatan maklum balas untuk staf.');
      return;
    }

    onRecordDecision({
      submissionId: submission.id,
      decision,
      adminNotes: adminNotes.trim(),
      privilegingLevel: decision === 'approved' ? privilegingLevel : undefined,
      validityYears: decision === 'approved' ? validityYears : undefined
    });

    onClose();
  };

  const getSupervisionBadge = (lvl: string) => {
    switch (lvl) {
      case 'level_4_independent':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">Tahap 4: Mandiri & Berdikari</span>;
      case 'level_3_indirect_supervision':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">Tahap 3: Pengawasan Tidak Terus</span>;
      case 'level_2_direct_supervision':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">Tahap 2: Pengawasan Terus</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Tahap 1: Pemerhatian Sahaja</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                Semakan & Penilaian JKCP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengesahan kelayakan dan penganugerahan priviledging klinikal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 md:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Staff Overview Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    {submission.staffName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {submission.staffName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {submission.staffGrade} • {submission.staffDepartment}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs">
                  <p className="text-slate-500 dark:text-slate-400">No. Pendaftaran:</p>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">
                    {submission.staffRegistrationNo}
                  </p>
                  <p className="text-[11px] text-slate-400">APC: {submission.staffApcNo}</p>
                </div>
              </div>

              {/* Procedure Details */}
              <div className="mt-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Kategori:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {submission.categoryName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Prosedur:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {submission.procedureName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Tarikh Dilakukan:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {submission.procedureDate} {submission.patientIdentifier ? `(Kes: ${submission.patientIdentifier})` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Tahap Pengawasan:</span>
                  <div className="mt-0.5">{getSupervisionBadge(submission.supervisionLevel)}</div>
                </div>
              </div>
            </div>

            {/* Clinical Content Inspection */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pelan Klinikal & Rasionale:
                </span>
                <p className="mt-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {submission.clinicalPlan || 'Tiada maklumat pelan.'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Peralatan Digunakan & Langkah Keselamatan:
                </span>
                <p className="mt-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {submission.equipmentUsed || 'Tiada maklumat peralatan.'}
                </p>
              </div>

              {submission.complicationsOrNotes && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Refleksi / Catatan Kes:
                  </span>
                  <p className="mt-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200">
                    {submission.complicationsOrNotes}
                  </p>
                </div>
              )}

              {/* Attachments */}
              {submission.attachments && submission.attachments.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Lampiran Bukti Log ({submission.attachments.length}):
                  </span>
                  <div className="mt-1.5 space-y-1.5">
                    {submission.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {att.name} ({(att.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <span className="text-[11px] text-lime-600 dark:text-lime-400 font-semibold">
                          Telah Disahkan
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Decision Selection Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Keputusan Penilaian JKCP
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('approved')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all',
                    decision === 'approved'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Luluskan (Approve)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('changes_requested')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all',
                    decision === 'changes_requested'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Minta Pindaan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('rejected')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all',
                    decision === 'rejected'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Tolak (Reject)</span>
                </button>
              </div>
            </div>

            {/* Approval Parameters (When Approved) */}
            {decision === 'approved' && (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tahap Privileging Diberikan:
                    </label>
                    <select
                      value={privilegingLevel}
                      onChange={(e) => setPrivilegingLevel(e.target.value as PrivilegingLevel)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="core">Prosedur Teras (Core Privileges)</option>
                      <option value="specialized">Prosedur Khusus / Lanjutan</option>
                      <option value="conditional">Bersyarat (Di Bawah Pengawasan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempoh Sahlaku KKM:
                    </label>
                    <select
                      value={validityYears}
                      onChange={(e) => setValidityYears(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value={3}>3 Tahun (Standard KKM)</option>
                      <option value={2}>2 Tahun</option>
                      <option value={1}>1 Tahun (Percubaan / Khas)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Notes Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {decision === 'approved'
                  ? 'Catatan Pengesahan JKCP / Perakuan'
                  : decision === 'changes_requested'
                  ? 'Perkara Yang Perlu Dipinda Oleh Staf (Wajib)'
                  : 'Rasionale Penolakan (Wajib)'}
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  decision === 'changes_requested'
                    ? 'Sila nyatakan dengan jelas dokumen atau pembetulan yang diperlukan...'
                    : 'Catatan pengesahan...'
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-5 md:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              className={cn(
                'px-5 py-2 text-xs md:text-sm font-bold rounded-xl shadow-xs text-white transition-all active:scale-95',
                decision === 'approved'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : decision === 'changes_requested'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              )}
            >
              Sahkan Keputusan ({decision === 'approved' ? 'Luluskan' : decision === 'changes_requested' ? 'Minta Pindaan' : 'Tolak'})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
