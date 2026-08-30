// src/modules/mypriviledging/pages/CredentialingCriteriaPage.tsx
// Dedicated Credentialing Criteria Page for Nurses & Assistant Medical Officers

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PriviledgingHeader,
  CredentialingCriteriaView,
  SubmitProcedureModal
} from '../components';
import { priviledgingService } from '../services/priviledgingService';
import type {
  ProcedureSubmission
} from '../types/priviledgingTypes';

export const CredentialingCriteriaPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const staffProfiles = priviledgingService.getAllStaffProfiles();
  const activeStaff = staffProfiles[0];
  const kpis = priviledgingService.getKpis();

  const handleSaveSubmission = (data: Partial<ProcedureSubmission>, isDraft: boolean) => {
    priviledgingService.saveSubmission(data as any);
  };

  return (
    <div className="min-h-screen pb-12">
      <PriviledgingHeader
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        pendingReviewsCount={kpis.pendingSubmissions}
        changesCount={activeStaff?.changesCount || 0}
      />

      <CredentialingCriteriaView
        initialRole={activeStaff?.role === 'amos' ? 'amos' : 'nurses'}
        onLogProcedureClick={() => navigate('/priviledging/catalog')}
      />

      <SubmitProcedureModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSave={handleSaveSubmission}
        activeStaff={activeStaff}
      />
    </div>
  );
};

export default CredentialingCriteriaPage;
