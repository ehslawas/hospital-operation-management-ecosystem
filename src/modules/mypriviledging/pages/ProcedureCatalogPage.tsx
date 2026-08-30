// src/modules/mypriviledging/pages/ProcedureCatalogPage.tsx
// Dedicated Procedure Catalog page matching reference AHP Logbook structure

import React, { useState } from 'react';
import {
  PriviledgingHeader,
  ProcedureCatalogExplorer,
  SubmitProcedureModal
} from '../components';
import { priviledgingService } from '../services/priviledgingService';
import type {
  ProcedureCategory,
  ProcedureItem,
  ProcedureSubmission
} from '../types/priviledgingTypes';

export const ProcedureCatalogPage: React.FC = () => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProcedureCategory | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureItem | null>(null);

  const staffProfiles = priviledgingService.getAllStaffProfiles();
  const activeStaff = staffProfiles[0];
  const kpis = priviledgingService.getKpis();

  const handleLogProcedure = (category: ProcedureCategory, item: ProcedureItem) => {
    setSelectedCategory(category);
    setSelectedProcedure(item);
    setIsSubmitModalOpen(true);
  };

  const handleSaveSubmission = (data: Partial<ProcedureSubmission>, isDraft: boolean) => {
    priviledgingService.saveSubmission(data as any);
  };

  return (
    <div className="min-h-screen pb-12">
      <PriviledgingHeader
        onOpenSubmitModal={() => {
          setSelectedCategory(null);
          setSelectedProcedure(null);
          setIsSubmitModalOpen(true);
        }}
        pendingReviewsCount={kpis.pendingSubmissions}
        changesCount={activeStaff?.changesCount || 0}
      />

      <ProcedureCatalogExplorer
        onLogProcedure={handleLogProcedure}
        selectedRoleFilter="both"
      />

      <SubmitProcedureModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSelectedCategory(null);
          setSelectedProcedure(null);
        }}
        onSave={handleSaveSubmission}
        initialCategory={selectedCategory}
        initialProcedure={selectedProcedure}
        activeStaff={activeStaff}
      />
    </div>
  );
};

export default ProcedureCatalogPage;
