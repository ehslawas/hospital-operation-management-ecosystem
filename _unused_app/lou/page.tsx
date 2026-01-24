import { getLOUs, addLOU } from '@/features/pharmacy-logistics/services/dataStore';

export const dynamic = 'force-dynamic';

async function addLOUAction(formData: FormData) {
  'use server';
  const ref = String(formData.get('ref') || '');
  const supplier = String(formData.get('supplier') || '');
  const validFrom = String(formData.get('validFrom') || '');
  const validTo = String(formData.get('validTo') || '');
  if (!ref || !supplier || !validFrom || !validTo) return;
  addLOU({ ref, supplier, validFrom, validTo });
}

export default async function LOUPage() {
  const lous = getLOUs();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Letter of Undertaking (LOU)</h1>
        <button className="inline-flex items-center rounded-md bg-cyan-600 px-3 py-1.5 text-white hover:bg-cyan-700">Upload LOU</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Add LOU Document</h2>
          <form action={addLOUAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
              <input name="ref" placeholder="LOU-REF-001" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <input name="supplier" placeholder="PharmaOne Ltd" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
                <input name="validFrom" type="date" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valid To</label>
                <input name="validTo" type="date" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-200" />
              </div>
            </div>
            <button type="submit" className="w-full rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700">Add LOU</button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">LOU Documents</h2>
          <div className="space-y-3">
            {lous.length === 0 ? (
              <div className="text-sm text-slate-500">No LOU documents uploaded</div>
            ) : (
              lous.map(lou => {
                const isValid = new Date(lou.validTo) > new Date();
                return (
                  <div key={lou.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-800">{lou.ref}</div>
                      <div className="text-sm text-slate-500">{lou.supplier} • {lou.validFrom} to {lou.validTo}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {isValid ? 'Valid' : 'Expired'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



