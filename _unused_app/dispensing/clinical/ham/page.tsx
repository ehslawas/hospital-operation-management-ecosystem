import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function HAMPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">High-Risk Medicines (HAM)</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4"><strong>High-Alert Medications requiring special controls:</strong></p>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Category A - Most Critical</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>Insulin</strong> - All forms (rapid/short/long-acting)</li>
                  <li><strong>Anticoagulants</strong> - Warfarin, Heparin, LMWH, NOACs</li>
                  <li><strong>Concentrated Electrolytes</strong> - KCl 15%, NaCl 3%, MgSO4</li>
                  <li><strong>Opioids</strong> - Morphine, Fentanyl, Pethidine</li>
                  <li><strong>Chemotherapy</strong> - All cytotoxic agents</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Category B - High Risk</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>NMBDs</strong> - Neuromuscular blocking drugs</li>
                  <li><strong>Sedatives</strong> - Propofol, Midazolam (IV)</li>
                  <li><strong>Paediatric</strong> - Weight-based dosing</li>
                  <li><strong>Oral Methotrexate</strong> - Weekly dosing errors</li>
                  <li><strong>IV Potassium</strong> - Must be diluted, never IV push</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-bold text-red-900 mb-2">Safety Controls:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-900">
                <li>Tall-man lettering (e.g., hydrALAZINE vs hydrOXYzine)</li>
                <li>Segregated storage with clear labeling</li>
                <li>Independent double-check required before administration</li>
                <li>Standard infusion concentrations</li>
                <li>Smart pump libraries</li>
                <li>Dosing calculators for weight-based/renal adjustments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

