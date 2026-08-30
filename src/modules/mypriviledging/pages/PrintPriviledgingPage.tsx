// src/modules/mypriviledging/pages/PrintPriviledgingPage.tsx
// Dedicated page for Official KKM Privileging Certificate & Authorisation Letter Print

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PriviledgingHeader,
  PriviledgingCertificatePrint
} from '../components';
import { priviledgingService } from '../services/priviledgingService';
import type {
  PrivilegingCertificateData,
  StaffPrivilegingProfile
} from '../types/priviledgingTypes';
import { User } from 'lucide-react';

export const PrintPriviledgingPage: React.FC = () => {
  const { staffId } = useParams<{ staffId?: string }>();
  const navigate = useNavigate();

  const [staffProfiles, setStaffProfiles] = useState<StaffPrivilegingProfile[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [certificateData, setCertificateData] = useState<PrivilegingCertificateData | null>(null);

  useEffect(() => {
    const allStaff = priviledgingService.getAllStaffProfiles();
    setStaffProfiles(allStaff);

    const targetId = staffId || allStaff[0]?.id || '';
    setSelectedStaffId(targetId);

    if (targetId) {
      const data = priviledgingService.getCertificateDataForStaff(targetId);
      setCertificateData(data);
    }
  }, [staffId]);

  const handleStaffChange = (newStaffId: string) => {
    setSelectedStaffId(newStaffId);
    const data = priviledgingService.getCertificateDataForStaff(newStaffId);
    setCertificateData(data);
    navigate(`/priviledging/print/${newStaffId}`, { replace: true });
  };

  const kpis = priviledgingService.getKpis();

  return (
    <div className="min-h-screen pb-12">
      <div className="print:hidden">
        <PriviledgingHeader
          pendingReviewsCount={kpis.pendingSubmissions}
        />

        {/* Staff Switcher Bar (Hidden during print) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Pegawai Untuk Cetakan Sijil:
            </span>
          </div>

          <select
            value={selectedStaffId}
            onChange={(e) => handleStaffChange(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          >
            {staffProfiles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.position} - {s.grade}) [Diluluskan: {s.approvedCount}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Certificate Print Component */}
      {certificateData ? (
        <PriviledgingCertificatePrint
          certificateData={certificateData}
          onBack={() => navigate('/priviledging')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Maklumat pegawai tidak dijumpai.
          </p>
        </div>
      )}
    </div>
  );
};

export default PrintPriviledgingPage;
