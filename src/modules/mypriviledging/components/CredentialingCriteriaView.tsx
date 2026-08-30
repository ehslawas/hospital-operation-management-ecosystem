// src/modules/mypriviledging/components/CredentialingCriteriaView.tsx
// Interactive Credentialing Criteria Component for Nurses & Assistant Medical Officers

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
  Award,
  AlertCircle,
  Plus,
  BookOpen,
  ArrowRight,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CREDENTIALING_CRITERIA } from '../data/credentialingCriteriaData';

interface CredentialingCriteriaViewProps {
  initialRole?: 'nurses' | 'amos';
  onLogProcedureClick?: () => void;
}

export const CredentialingCriteriaView: React.FC<CredentialingCriteriaViewProps> = ({
  initialRole = 'nurses',
  onLogProcedureClick
}) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'nurses' | 'amos'>(initialRole);

  const criteria = CREDENTIALING_CRITERIA[selectedRole];

  return (
    <div className="space-y-6">
      {/* Role Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Kriteria & Standard Credentialing KKM
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Piawaian syarat kelayakan, bukti sokongan, dan senarai semak pentauliahan klinikal
            </p>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedRole('nurses')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                selectedRole === 'nurses'
                  ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <span>Jururawat (Nurses)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('amos')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                selectedRole === 'amos'
                  ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <span>Penolong Pegawai Perubatan (AMO)</span>
            </button>
          </div>
        </div>

        {/* Selected Role Hero Banner */}
        <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-1">
                {criteria.roleChip}
              </span>
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                {criteria.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed max-w-2xl">
                {criteria.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Panduan</span>
            </button>
            <button
              type="button"
              onClick={() => onLogProcedureClick ? onLogProcedureClick() : navigate('/priviledging/catalog')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buka Katalog Prosedur</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Core Criteria Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Minimum Requirements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Minimum Requirements
              </h4>
            </div>

            <ul className="space-y-3">
              {criteria.minimumRequirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500">
              Tempoh Sahlaku Sijil: <strong className="text-slate-800 dark:text-slate-200">{criteria.validityPeriod}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: Supporting Evidence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Supporting Evidence
              </h4>
            </div>

            <ul className="space-y-3">
              {criteria.supportingEvidence.map((ev, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5" />
              Pengesahan Pakar / KPPP Diperlukan
            </span>
          </div>
        </div>

        {/* Card 3: Submission Checklist */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Submission Checklist
              </h4>
            </div>

            <ul className="space-y-3">
              {criteria.submissionChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Kelulusan Terus Melalui Portal
            </span>
          </div>
        </div>
      </div>

      {/* MOH / KKM Governance Notice Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Garis Panduan Governan Klinikal KKM & Pembaharuan Credentialing
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {criteria.kkmGovernanceNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs text-slate-700 dark:text-slate-300"
                >
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Syarat {idx + 1}:
                  </span>
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
