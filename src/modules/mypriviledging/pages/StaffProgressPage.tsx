// src/modules/mypriviledging/pages/StaffProgressPage.tsx
// Hospital-wide Staff Competency & Privileging Matrix Directory

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PriviledgingHeader,
  StaffCompetencyMatrix
} from '../components';
import { priviledgingService } from '../services/priviledgingService';
import type { StaffPrivilegingProfile } from '../types/priviledgingTypes';

export const StaffProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<StaffPrivilegingProfile[]>([]);

  useEffect(() => {
    priviledgingService.setActiveMode('admin');
    const allStaff = priviledgingService.getAllStaffProfiles();
    setStaffList(allStaff);
  }, []);

  const kpis = priviledgingService.getKpis();

  const handleViewCertificate = (staffId: string) => {
    navigate(`/priviledging/print/${staffId}`);
  };

  return (
    <div className="min-h-screen pb-12">
      <PriviledgingHeader
        isAdminMode={true}
        pendingReviewsCount={kpis.pendingSubmissions}
      />

      <StaffCompetencyMatrix
        staffList={staffList}
        onViewCertificate={handleViewCertificate}
      />
    </div>
  );
};

export default StaffProgressPage;
