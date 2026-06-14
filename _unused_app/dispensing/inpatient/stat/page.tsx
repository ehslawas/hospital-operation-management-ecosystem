import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function STATPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">STAT Orders (Emergency Supply)</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4">Fast emergency medication issuance:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Fast issuance with reason codes</li>
              <li>After-hours/on-call pharmacist supply</li>
              <li>Auto-backfill to patient profile</li>
              <li>First-dose-within-60min tracking (for STAT antibiotics)</li>
              <li>Priority alerts and notifications</li>
              <li>STAT medication log and audit trail</li>
            </ul>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

