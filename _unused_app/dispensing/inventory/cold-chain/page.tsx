import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function ColdChainPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Cold Chain Management</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4"><strong>Temperature-sensitive medication storage and monitoring:</strong></p>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">🧊 Refrigerated (2-8°C)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>Insulin:</strong> All forms (vials, pens, cartridges)</li>
                  <li><strong>Vaccines:</strong> MMR, Hepatitis B, Influenza, COVID-19</li>
                  <li><strong>Biologics:</strong> Adalimumab, Etanercept, Infliximab</li>
                  <li><strong>Antibiotics (reconstituted):</strong> Ceftriaxone, Piperacillin-Tazobactam</li>
                  <li><strong>Eye Drops:</strong> Some prostaglandin analogs</li>
                  <li><strong>Suppositories:</strong> Certain rectal preparations</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-2">❄️ Frozen (-15 to -25°C)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>Vaccines (specific):</strong> Some COVID-19 vaccines</li>
                  <li><strong>Biological specimens</strong></li>
                  <li><strong>Certain enzyme preparations</strong></li>
                  <li><strong>Research/investigational drugs</strong></li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <h3 className="font-bold text-blue-900 mb-2">📊 Temperature Monitoring & Controls:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
                <li><strong>Continuous Monitoring:</strong> Digital data loggers with min/max recording</li>
                <li><strong>Alarms:</strong> Audio/visual alerts for temperature excursions (out of 2-8°C)</li>
                <li><strong>Daily Logs:</strong> Manual temperature checks at start/end of shift</li>
                <li><strong>Excursion Protocol:</strong> Quarantine → assess stability → decision to use/discard</li>
                <li><strong>Backup Power:</strong> UPS/generator for refrigerators</li>
                <li><strong>Cold Packs:</strong> For transport between wards/facilities</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-xs font-bold text-green-900 uppercase mb-1">Fridge A (Main)</p>
                <p className="text-3xl font-bold text-green-600">5.2°C</p>
                <p className="text-xs text-green-700">✓ Within range (2-8°C)</p>
                <p className="text-xs text-gray-600 mt-2">Min: 4.1°C | Max: 6.3°C</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-xs font-bold text-green-900 uppercase mb-1">Fridge B (Backup)</p>
                <p className="text-3xl font-bold text-green-600">4.8°C</p>
                <p className="text-xs text-green-700">✓ Within range (2-8°C)</p>
                <p className="text-xs text-gray-600 mt-2">Min: 3.9°C | Max: 5.7°C</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-xs font-bold text-red-900 uppercase mb-1">⚠️ Excursions</p>
                <p className="text-3xl font-bold text-red-600">1</p>
                <p className="text-xs text-red-700">Yesterday 22:30-23:15</p>
                <p className="text-xs text-gray-600 mt-2">Status: Quarantined</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-bold text-yellow-900 mb-2">⚠️ Latest Temperature Excursion</h3>
              <div className="text-sm text-yellow-900">
                <p><strong>Date/Time:</strong> 10 Jan 2025, 22:30 - 23:15 (45 minutes)</p>
                <p><strong>Refrigerator:</strong> Fridge A (Main)</p>
                <p><strong>Temperature Range:</strong> 10.2°C - 12.5°C (exceeded 8°C limit)</p>
                <p><strong>Cause:</strong> Door left ajar during night shift</p>
                <p><strong>Action Taken:</strong> 12 insulin vials quarantined, pharmacist assessment in progress</p>
                <p><strong>Status:</strong> <span className="text-orange-600 font-bold">Pending decision (Use/Discard)</span></p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                View Logs
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Record Manual Check
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                Report Excursion
              </button>
            </div>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

