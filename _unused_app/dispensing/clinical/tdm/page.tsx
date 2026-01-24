import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function TDMPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Therapeutic Drug Monitoring (TDM)</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4">Monitor drug levels and provide dose recommendations:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Vancomycin</strong> - AUC 400-600 mg·h/L target</li>
              <li><strong>Gentamicin/Amikacin</strong> - Peak/trough monitoring</li>
              <li><strong>Phenytoin</strong> - Sheiner-Tozer correction for low albumin</li>
              <li><strong>Valproate, Carbamazepine, Lithium</strong> - Therapeutic ranges</li>
              <li><strong>Digoxin, Theophylline</strong> - Toxicity monitoring</li>
              <li><strong>Tacrolimus/Cyclosporine</strong> - Transplant monitoring</li>
              <li><strong>Voriconazole</strong> - Antifungal TDM</li>
            </ul>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900"><strong>Features:</strong> Planner, Calculator (AUC/Bayesian), Next sample timing, TDM report generation</p>
            </div>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

