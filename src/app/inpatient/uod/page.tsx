import { InpatientProviders } from '@/features/inpatient-pharmacy/components/Providers';

export default function UODPage() {
  return (
    <InpatientProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Unit-of-Dose (UOD)</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">This module is under development.</p>
            <p className="text-sm text-gray-500 mt-2">UOD dose-time packing, picking lists, and ward rounds supply.</p>
          </div>
        </div>
      </div>
    </InpatientProviders>
  );
}

