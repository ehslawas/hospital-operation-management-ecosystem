import { PharmacyProviders } from '@/features/pharmacy-counter/components/Providers';

export default function DDRegisterPage() {
  return (
    <PharmacyProviders>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">DD/CD Register (Dangerous Drugs & Controlled Drugs)</h1>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4"><strong>Airtight control and audit trail for controlled substances:</strong></p>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Transaction Types</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>Receipt:</strong> Stock received with supplier invoice</li>
                  <li><strong>Issue:</strong> Dispensed to patient (outpatient/inpatient)</li>
                  <li><strong>Return:</strong> Patient returns unused medication</li>
                  <li><strong>Wastage:</strong> Damaged/expired stock with witness</li>
                  <li><strong>Disposal:</strong> Authorized destruction with authority witness</li>
                  <li><strong>Transfer:</strong> Inter-facility transfer with documentation</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Drugs Under Control</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>Opioids:</strong> Morphine, Fentanyl, Pethidine, Tramadol</li>
                  <li><strong>Benzodiazepines:</strong> Diazepam, Midazolam, Lorazepam</li>
                  <li><strong>Psychotropics:</strong> Ketamine, Barbiturates</li>
                  <li><strong>Stimulants:</strong> Methylphenidate, Amphetamines</li>
                  <li><strong>Others:</strong> Buprenorphine, Methadone</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
              <h3 className="font-bold text-red-900 mb-2">🔒 Security Controls:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-900">
                <li><strong>Witness Required:</strong> All CD transactions must have a pharmacist/technician witness</li>
                <li><strong>Running Balance:</strong> Real-time balance after each transaction</li>
                <li><strong>No Deletion:</strong> Cannot delete entries; void/reversal only with reason</li>
                <li><strong>Shift Reconciliation:</strong> Daily reconciliation at shift change</li>
                <li><strong>Discrepancy Escalation:</strong> Immediate investigation and reporting</li>
                <li><strong>Ward Audits:</strong> Monthly physical count vs register balance</li>
                <li><strong>Immutable Logs:</strong> Audit trail with user/timestamp/IP cannot be modified</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-xs font-bold text-blue-900 uppercase mb-1">Today's Issues</p>
                <p className="text-3xl font-bold text-blue-600">24</p>
                <p className="text-xs text-blue-700">DD dispensed</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-xs font-bold text-green-900 uppercase mb-1">Returns</p>
                <p className="text-3xl font-bold text-green-600">3</p>
                <p className="text-xs text-green-700">Patient returns</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-xs font-bold text-yellow-900 uppercase mb-1">Wastage</p>
                <p className="text-3xl font-bold text-yellow-600">1</p>
                <p className="text-xs text-yellow-700">Requiring disposal</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-xs font-bold text-red-900 uppercase mb-1">Discrepancies</p>
                <p className="text-3xl font-bold text-red-600">0</p>
                <p className="text-xs text-red-700">Under investigation</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                View Register
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                New Transaction
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                Shift Reconciliation
              </button>
            </div>
          </div>
        </div>
      </div>
    </PharmacyProviders>
  );
}

