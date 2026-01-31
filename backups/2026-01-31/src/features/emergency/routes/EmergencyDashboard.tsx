import React from 'react';
import ETUDashboard from './ETUDashboard';
import { FeatureGate } from '@/components/PermissionGates';
import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';

export default function EmergencyDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FeatureGate
        feature="emergency_dashboard"
        fallback={
          <ComingSoonPlaceholder
            title="Emergency Dashboard"
            message="You do not have permission to access the Emergency & Trauma dashboard."
            type="locked"
          />
        }
      >
        <ETUDashboard />
      </FeatureGate>
    </div>
  );
}
