import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function IVAdmixPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">IV Admixture & Total Parenteral Nutrition (TPN)</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">CIVAS (Centralized Intravenous Additive Service)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>Sterile compounding of IV admixtures</li>
                  <li>Chemotherapy preparation with CSTD (Closed System Transfer Device)</li>
                  <li>Antibiotic reconstitution and dilution</li>
                  <li>Gravimetric checks for accuracy</li>
                  <li>Beyond-Use Dating (BUD) according to USP standards</li>
                  <li>Environmental monitoring (ISO Class 5 LAF/BSC)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3">TPN (Total Parenteral Nutrition)</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>Individualized TPN calculation (calories, protein, lipids)</li>
                  <li>Electrolyte and trace element additions</li>
                  <li>Stability and compatibility checks</li>
                  <li>Aseptic compounding with strict protocols</li>
                  <li>Pediatric vs Adult TPN formulations</li>
                  <li>Monitoring parameters (electrolytes, liver function, glucose)</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded">
              <h3 className="font-bold text-purple-900 mb-2">Safety & Quality:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-purple-900">
                <li><strong>Worksheets:</strong> Master formulas, batch records with double-check signatures</li>
                <li><strong>Stability Hints:</strong> Drug-drug incompatibilities, pH considerations</li>
                <li><strong>Temperature Control:</strong> Cold chain for antibiotics, refrigerated storage</li>
                <li><strong>Spill Kits:</strong> Cytotoxic spill management, decontamination procedures</li>
                <li><strong>PPE:</strong> Gowns, gloves, masks for hazardous drug handling</li>
              </ul>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-xs font-bold text-blue-900 uppercase mb-1">Today's Queue</p>
                <p className="text-3xl font-bold text-blue-600">12</p>
                <p className="text-xs text-blue-700">CIVAS preparations pending</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-xs font-bold text-green-900 uppercase mb-1">TPN Active</p>
                <p className="text-3xl font-bold text-green-600">8</p>
                <p className="text-xs text-green-700">Patients on TPN</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-xs font-bold text-yellow-900 uppercase mb-1">Chemo Pending</p>
                <p className="text-3xl font-bold text-yellow-600">5</p>
                <p className="text-xs text-yellow-700">Cytotoxic preparations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

