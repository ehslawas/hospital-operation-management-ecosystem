import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function AMSPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Antimicrobial Stewardship (AMS)</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4">Review and optimize antibiotic use:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Daily List:</strong> Cultures, broad-spectrum exposure, IV→PO switch candidates</li>
              <li><strong>Duration Caps:</strong> 72-hour time-outs, automatic review triggers</li>
              <li><strong>De-escalation:</strong> Culture-directed therapy recommendations</li>
              <li><strong>Metrics:</strong> DOT (Days of Therapy), DDD (Defined Daily Dose), Switch rates</li>
              <li><strong>Restricted Antibiotics:</strong> Approval workflows for carbapenems, colistin, etc.</li>
              <li><strong>Prophylaxis Review:</strong> Surgical prophylaxis duration compliance</li>
            </ul>
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-900"><strong>Goal:</strong> Reduce resistance, improve clinical outcomes, optimize antibiotic use</p>
            </div>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

