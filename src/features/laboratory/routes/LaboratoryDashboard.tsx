import React from 'react';
import { FeatureGate } from '@/components/PermissionGates';
import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';
import GenericDepartmentDashboard from '@/pages/dashboard/GenericDepartmentDashboard';

export default function LaboratoryDashboard() {
  return (
    <FeatureGate
      feature="laboratory_dashboard"
      fallback={
        <ComingSoonPlaceholder
          title="Pathology Dashboard"
          message="You do not have permission to access the Pathology dashboard."
          type="locked"
        />
      }
    >
      <GenericDepartmentDashboard />
    </FeatureGate>
  );
}
