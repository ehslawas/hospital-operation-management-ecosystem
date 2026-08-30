// src/modules/mypriviledging/components/PriviledgingHeader.tsx
// Modern Government Design System Header (Clean, Authoritative, Single Primary Sidebar Navigation)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  ArrowLeft,
  ShieldCheck,
  User,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { priviledgingService } from '../services/priviledgingService';

interface PriviledgingHeaderProps {
  isAdminMode?: boolean;
  onToggleAdminMode?: (isAdmin: boolean) => void;
  onOpenSubmitModal?: () => void;
  pendingReviewsCount?: number;
  changesCount?: number;
}

export const PriviledgingHeader: React.FC<PriviledgingHeaderProps> = ({
  isAdminMode = false,
  onToggleAdminMode,
  onOpenSubmitModal,
  pendingReviewsCount = 0,
  changesCount = 0
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs">
        {/* Left: Crest, Title, Description */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(ROUTES.HUB)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Kembali ke Hub Utama"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 shadow-2xs">
            <UserCheck className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                MyPriviledging
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Piawaian KKM C&P
              </span>
              {pendingReviewsCount > 0 && isAdminMode && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {pendingReviewsCount} Menunggu Tindakan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sistem Buku Log & Perakuan Penurunan Kuasa Klinikal Hospital Lawas
            </p>
          </div>
        </div>

        {/* Right: Role Mode Selector & Action Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* User/Admin Role Switcher */}
          {onToggleAdminMode && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  priviledgingService.setActiveMode('staff');
                  onToggleAdminMode(false);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                  !isAdminMode
                    ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-200 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <User className="w-3.5 h-3.5" />
                <span>Mod Staf</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  priviledgingService.setActiveMode('admin');
                  onToggleAdminMode(true);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                  isAdminMode
                    ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Mod Admin JKCP</span>
              </button>
            </div>
          )}

          {/* Quick Submit Procedure Action Button */}
          {onOpenSubmitModal && (
            <button
              onClick={onOpenSubmitModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs md:text-sm font-semibold rounded-xl shadow-xs hover:shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log Prosedur Baru</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
