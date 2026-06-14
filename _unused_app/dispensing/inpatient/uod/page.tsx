import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function UODPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Unit-of-Dose (UOD) Supply</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4">Dose-by-dose ward supply management:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Dose-time grid per MAR (06:00, 12:00, 18:00, 22:00)</li>
              <li>Picking labels with Name/MRN/Ward/Drug/Dose/Admin Time</li>
              <li>Ward round supply</li>
              <li>Patient bin management</li>
              <li>Double-check workflow for high-risk medications</li>
            </ul>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

