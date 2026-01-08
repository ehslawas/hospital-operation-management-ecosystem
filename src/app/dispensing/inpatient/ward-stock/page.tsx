import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function WardStockPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Ward Stock & Imprest Management</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4">Ward stock (imprest) management:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>PAR (Periodic Automatic Replenishment) levels</li>
              <li>Top-up workflows with cycle counts</li>
              <li>Exclusions for High-Alert Medications (HAM)</li>
              <li>Ward stock audits</li>
              <li>Expiry management</li>
              <li>Emergency box/trolley checklists</li>
            </ul>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

